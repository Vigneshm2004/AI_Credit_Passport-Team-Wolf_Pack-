module CreditPassport::sbt {
    use std::signer;
    use std::string::String;
    use aptos_framework::event;
    use aptos_framework::timestamp;

    /// Error codes
    const ENO_PASSPORT_FOUND: u64 = 1;

    /// Soulbound Passport structure
    struct Passport has key {
        owner: address,
        cid: String,
        score: u64,
        issuer: address,
        issued_at: u64,
        data_hash: String,
    }

    /// Event emitted when a passport is minted
    #[event]
    struct PassportMinted has drop, store {
        owner: address,
        score: u64,
        cid: String,
        issuer: address,
        timestamp: u64,
    }

    /// Mint a new soulbound passport
    public entry fun mint_passport(
        issuer: &signer,
        owner: address,
        cid: String,
        score: u64,
        data_hash: String,
    ) acquires Passport {
        if (exists<Passport>(owner)) {
            let old_passport = move_from<Passport>(owner);
            let Passport { owner: _, cid: _, score: _, issuer: _, issued_at: _, data_hash: _ } = old_passport;
        };

        let issuer_address = signer::address_of(issuer);
        let current_timestamp = timestamp::now_seconds();

        let passport = Passport {
            owner,
            cid,
            score,
            issuer: issuer_address,
            issued_at: current_timestamp,
            data_hash,
        };

        move_to(issuer, passport);

        event::emit(PassportMinted {
            owner,
            score,
            cid,
            issuer: issuer_address,
            timestamp: current_timestamp,
        });
    }

    /// Get passport score
    #[view]
    public fun get_score(owner: address): u64 acquires Passport {
        assert!(exists<Passport>(owner), ENO_PASSPORT_FOUND);
        let passport = borrow_global<Passport>(owner);
        passport.score
    }

    /// Check if address has a passport
    #[view]
    public fun has_passport(owner: address): bool {
        exists<Passport>(owner)
    }
}