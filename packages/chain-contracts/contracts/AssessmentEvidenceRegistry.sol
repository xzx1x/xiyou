// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract AssessmentEvidenceRegistry {
    address public owner;
    mapping(bytes32 => bool) private usedAuthorizations;

    struct AssessmentRecord {
        uint8 assessmentType;
        bytes32 recordHash;
        uint64 recordedAt;
        uint32 revision;
        address operator;
        bool exists;
    }

    mapping(bytes32 => AssessmentRecord) private assessmentRecords;

    event AssessmentRecorded(
        bytes32 indexed assessmentKey,
        uint8 indexed assessmentType,
        bytes32 indexed recordHash,
        uint256 revision,
        uint256 recordedAt,
        address operator
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can record evidence");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "New owner is zero address");
        owner = newOwner;
    }

    function recordAssessment(
        bytes32 assessmentKey,
        uint8 assessmentType,
        bytes32 recordHash
    ) external onlyOwner returns (uint256 revision) {
        return _recordAssessment(assessmentKey, assessmentType, recordHash);
    }

    function recordAssessmentWithSignature(
        bytes32 assessmentKey,
        uint8 assessmentType,
        bytes32 recordHash,
        bytes calldata ownerSignature
    ) external returns (uint256 revision) {
        bytes32 authorizationHash = getAuthorizationHash(
            assessmentKey,
            assessmentType,
            recordHash
        );

        require(ownerSignature.length == 65, "signature length is invalid");
        require(
            !usedAuthorizations[authorizationHash],
            "authorization already used"
        );
        require(
            _recoverSigner(authorizationHash, ownerSignature) == owner,
            "authorization is invalid"
        );

        usedAuthorizations[authorizationHash] = true;
        return _recordAssessment(assessmentKey, assessmentType, recordHash);
    }

    function getAuthorizationHash(
        bytes32 assessmentKey,
        uint8 assessmentType,
        bytes32 recordHash
    ) public view returns (bytes32) {
        return
            keccak256(
                abi.encode(
                    address(this),
                    block.chainid,
                    "ASSESSMENT_RECORD",
                    assessmentKey,
                    assessmentType,
                    recordHash
                )
            );
    }

    function _recordAssessment(
        bytes32 assessmentKey,
        uint8 assessmentType,
        bytes32 recordHash
    ) internal returns (uint256 revision) {
        require(assessmentKey != bytes32(0), "assessmentKey is required");
        require(assessmentType <= 4, "assessmentType is invalid");
        require(recordHash != bytes32(0), "recordHash is required");

        AssessmentRecord storage record = assessmentRecords[assessmentKey];
        if (!record.exists) {
            record.assessmentType = assessmentType;
            record.revision = 1;
            record.exists = true;
        } else {
            require(record.assessmentType == assessmentType, "assessmentType mismatch");
            record.revision += 1;
        }

        record.recordHash = recordHash;
        record.recordedAt = uint64(block.timestamp);
        record.operator = msg.sender;
        revision = record.revision;

        emit AssessmentRecorded(
            assessmentKey,
            assessmentType,
            recordHash,
            revision,
            block.timestamp,
            msg.sender
        );
    }

    function _recoverSigner(
        bytes32 authorizationHash,
        bytes calldata signature
    ) private pure returns (address signer) {
        bytes32 digest = keccak256(
            abi.encodePacked(
                "\x19Ethereum Signed Message:\n32",
                authorizationHash
            )
        );

        bytes32 r;
        bytes32 s;
        uint8 v;

        assembly {
            r := calldataload(signature.offset)
            s := calldataload(add(signature.offset, 32))
            v := byte(0, calldataload(add(signature.offset, 64)))
        }

        if (v < 27) {
            v += 27;
        }

        require(v == 27 || v == 28, "signature recovery id is invalid");

        signer = ecrecover(digest, v, r, s);
        require(signer != address(0), "signature signer is invalid");
    }

    function getLatestAssessmentEvidence(
        bytes32 assessmentKey
    )
        external
        view
        returns (
            uint8 assessmentType,
            bytes32 recordHash,
            uint256 revision,
            uint256 recordedAt,
            address operator
        )
    {
        AssessmentRecord storage record = assessmentRecords[assessmentKey];
        require(record.exists, "assessment not found");
        return (
            record.assessmentType,
            record.recordHash,
            record.revision,
            record.recordedAt,
            record.operator
        );
    }

    function getAssessmentRevisionCount(
        bytes32 assessmentKey
    ) external view returns (uint256) {
        AssessmentRecord storage record = assessmentRecords[assessmentKey];
        return record.exists ? record.revision : 0;
    }
}
