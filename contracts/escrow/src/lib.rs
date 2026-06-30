#![no_std]

use soroban_sdk::{
    contract, contractevent, contractimpl, contracttype, symbol_short, token, Address, Bytes,
    BytesN, Env, IntoVal,
};

pub const JOURNAL_LEN: u32 = 68;

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum RequestStatus {
    Pending,
    Settled,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct LoanRequest {
    pub lender: Address,
    pub borrower: Address,
    pub provider: Address,
    pub amount: i128,
    pub provider_fee: i128,
    pub score_threshold: u32,
    pub status: RequestStatus,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum SettlementOutcome {
    ThresholdMet,
    ThresholdNotMet,
}

#[contracttype]
pub enum DataKey {
    Admin,
    Verifier,
    ImageId,
    Token,
    NextId,
    Request(u64),
}

#[contractevent]
pub struct RequestCreated {
    #[topic]
    pub request_id: u64,
    pub lender: Address,
    pub borrower: Address,
    pub provider: Address,
    pub amount: i128,
    pub provider_fee: i128,
    pub score_threshold: u32,
}

#[contractevent]
pub struct ProofVerified {
    #[topic]
    pub request_id: u64,
    pub score: u32,
}

#[contractevent]
pub struct Settled {
    #[topic]
    pub request_id: u64,
    pub outcome: SettlementOutcome,
    pub score: u32,
}

#[contract]
pub struct LoanEscrow;

#[contractimpl]
impl LoanEscrow {
    pub fn init(
        env: Env,
        admin: Address,
        verifier: Address,
        image_id: BytesN<32>,
        token: Address,
    ) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("already initialized");
        }
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Verifier, &verifier);
        env.storage().instance().set(&DataKey::ImageId, &image_id);
        env.storage().instance().set(&DataKey::Token, &token);
        env.storage().instance().set(&DataKey::NextId, &1u64);
    }

    pub fn set_image_id(env: Env, image_id: BytesN<32>) {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .expect("not initialized");
        admin.require_auth();
        env.storage().instance().set(&DataKey::ImageId, &image_id);
    }

    pub fn create_request(
        env: Env,
        lender: Address,
        borrower: Address,
        provider: Address,
        amount: i128,
        provider_fee: i128,
        score_threshold: u32,
    ) -> u64 {
        if amount <= 0 || provider_fee < 0 {
            panic!("invalid amounts");
        }
        lender.require_auth();

        let token: Address = env
            .storage()
            .instance()
            .get(&DataKey::Token)
            .expect("not initialized");
        let token_client = token::Client::new(&env, &token);
        let contract = env.current_contract_address();
        let total = amount
            .checked_add(provider_fee)
            .expect("overflow");
        token_client.transfer(&lender, &contract, &total);

        let request_id: u64 = env
            .storage()
            .instance()
            .get(&DataKey::NextId)
            .unwrap_or(1);
        env.storage().instance().set(&DataKey::NextId, &(request_id + 1));

        let request = LoanRequest {
            lender: lender.clone(),
            borrower: borrower.clone(),
            provider: provider.clone(),
            amount,
            provider_fee,
            score_threshold,
            status: RequestStatus::Pending,
        };
        env.storage()
            .persistent()
            .set(&DataKey::Request(request_id), &request);

        RequestCreated {
            request_id,
            lender,
            borrower,
            provider,
            amount,
            provider_fee,
            score_threshold,
        }
        .publish(&env);

        request_id
    }

    pub fn submit_proof_and_settle(
        env: Env,
        request_id: u64,
        seal: Bytes,
        image_id: BytesN<32>,
        journal_digest: BytesN<32>,
        journal_bytes: Bytes,
    ) -> SettlementOutcome {
        let expected_image: BytesN<32> = env
            .storage()
            .instance()
            .get(&DataKey::ImageId)
            .expect("not initialized");
        if image_id != expected_image {
            panic!("image id mismatch");
        }

        if journal_bytes.len() != JOURNAL_LEN {
            panic!("journal length invalid");
        }

        let mut request: LoanRequest = env
            .storage()
            .persistent()
            .get(&DataKey::Request(request_id))
            .expect("request not found");
        if request.status != RequestStatus::Pending {
            panic!("request not pending");
        }

        let verifier: Address = env
            .storage()
            .instance()
            .get(&DataKey::Verifier)
            .expect("not initialized");

        env.invoke_contract::<()>(
            &verifier,
            &symbol_short!("verify"),
            (seal, image_id, journal_digest).into_val(&env),
        );

        let score = decode_score(&journal_bytes);

        ProofVerified {
            request_id,
            score,
        }
        .publish(&env);

        let token: Address = env
            .storage()
            .instance()
            .get(&DataKey::Token)
            .expect("not initialized");
        let token_client = token::Client::new(&env, &token);
        let contract = env.current_contract_address();

        token_client.transfer(&contract, &request.provider, &request.provider_fee);

        let outcome = if score >= request.score_threshold {
            token_client.transfer(&contract, &request.borrower, &request.amount);
            SettlementOutcome::ThresholdMet
        } else {
            token_client.transfer(&contract, &request.lender, &request.amount);
            SettlementOutcome::ThresholdNotMet
        };

        request.status = RequestStatus::Settled;
        env.storage()
            .persistent()
            .set(&DataKey::Request(request_id), &request);

        Settled {
            request_id,
            outcome: outcome.clone(),
            score,
        }
        .publish(&env);

        outcome
    }

    pub fn get_request(env: Env, request_id: u64) -> LoanRequest {
        env.storage()
            .persistent()
            .get(&DataKey::Request(request_id))
            .expect("request not found")
    }
}

fn decode_score(journal_bytes: &Bytes) -> u32 {
    let mut score_bytes = [0u8; 4];
    for (i, byte) in score_bytes.iter_mut().enumerate() {
        *byte = journal_bytes.get(64 + i as u32).expect("journal score bytes");
    }
    u32::from_le_bytes(score_bytes)
}

#[cfg(test)]
mod test;
