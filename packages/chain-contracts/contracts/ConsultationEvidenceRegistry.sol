// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ConsultationEvidenceRegistry {
    address public owner;
    mapping(bytes32 => bool) private usedAuthorizations;

    struct ConsultationRevision {
        bytes32 recordHash;
        uint64 recordedAt;
        address operator;
    }

    struct ConsultationMetadata {
        string appointmentId;
        bool exists;
    }

    mapping(string => ConsultationMetadata) private consultationMetadata;
    mapping(string => ConsultationRevision[]) private consultationRevisions;

    event ConsultationRecorded(
        string indexed consultationId,
        string indexed appointmentId,
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

    function recordConsultation(
        string calldata consultationId,
        string calldata appointmentId,
        bytes32 recordHash
    ) external onlyOwner returns (uint256 revision) {
        return _recordConsultation(consultationId, appointmentId, recordHash);
    }

    function recordConsultationWithSignature(
        string calldata consultationId,
        string calldata appointmentId,
        bytes32 recordHash,
        bytes calldata ownerSignature
    ) external returns (uint256 revision) {
        bytes32 authorizationHash = getAuthorizationHash(
            consultationId,
            appointmentId,
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
        return _recordConsultation(consultationId, appointmentId, recordHash);
    }

    function getAuthorizationHash(
        string calldata consultationId,
        string calldata appointmentId,
        bytes32 recordHash
    ) public view returns (bytes32) {
        return
            keccak256(
                abi.encode(
                    address(this),
                    block.chainid,
                    "CONSULTATION_RECORD",
                    consultationId,
                    appointmentId,
                    recordHash
                )
            );
    }

    function _recordConsultation(
        string calldata consultationId,
        string calldata appointmentId,
        bytes32 recordHash
    ) internal returns (uint256 revision) {
        require(bytes(consultationId).length > 0, "consultationId is required");
        require(bytes(appointmentId).length > 0, "appointmentId is required");
        require(recordHash != bytes32(0), "recordHash is required");

        ConsultationMetadata storage metadata = consultationMetadata[consultationId];
        if (!metadata.exists) {
            metadata.appointmentId = appointmentId;
            metadata.exists = true;
        } else {
            require(
                keccak256(bytes(metadata.appointmentId)) ==
                    keccak256(bytes(appointmentId)),
                "appointmentId mismatch"
            );
        }

        consultationRevisions[consultationId].push(
            ConsultationRevision({
                recordHash: recordHash,
                recordedAt: uint64(block.timestamp),
                operator: msg.sender
            })
        );
        revision = consultationRevisions[consultationId].length;

        emit ConsultationRecorded(
            consultationId,
            appointmentId,
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

    function getLatestConsultationEvidence(
        string calldata consultationId
    )
        external
        view
        returns (
            string memory appointmentId,
            bytes32 recordHash,
            uint256 revision,
            uint256 recordedAt,
            address operator
        )
    {
        ConsultationMetadata storage metadata = consultationMetadata[consultationId];
        require(metadata.exists, "consultation not found");

        ConsultationRevision[] storage revisions = consultationRevisions[consultationId];
        ConsultationRevision storage latest = revisions[revisions.length - 1];
        return (
            metadata.appointmentId,
            latest.recordHash,
            revisions.length,
            latest.recordedAt,
            latest.operator
        );
    }

    function getConsultationRevisionCount(
        string calldata consultationId
    ) external view returns (uint256) {
        return consultationRevisions[consultationId].length;
    }
}
