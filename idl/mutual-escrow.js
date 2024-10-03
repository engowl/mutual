const MUTUAL_ESCROW_IDL = {"version":"0.1.0","name":"mutual_escrow","instructions":[{"name":"initialize","accounts":[{"name":"escrow","isMut":true,"isSigner":false},{"name":"admin","isMut":true,"isSigner":true},{"name":"systemProgram","isMut":false,"isSigner":false}],"args":[]},{"name":"createDeal","accounts":[{"name":"escrow","isMut":true,"isSigner":false},{"name":"deal","isMut":true,"isSigner":false},{"name":"projectOwner","isMut":true,"isSigner":true},{"name":"kol","isMut":false,"isSigner":false},{"name":"mint","isMut":false,"isSigner":false},{"name":"projectOwnerTokenAccount","isMut":true,"isSigner":false},{"name":"vaultTokenAccount","isMut":true,"isSigner":false},{"name":"vaultAuthority","isMut":false,"isSigner":false},{"name":"tokenProgram","isMut":false,"isSigner":false},{"name":"systemProgram","isMut":false,"isSigner":false},{"name":"rent","isMut":false,"isSigner":false}],"args":[{"name":"amount","type":"u64"},{"name":"vestingType","type":{"defined":"VestingType"}},{"name":"vestingDuration","type":"i64"},{"name":"marketcapAuthorizer","type":{"option":"publicKey"}},{"name":"orderId","type":{"array":["u8",16]}}]},{"name":"acceptDeal","accounts":[{"name":"deal","isMut":true,"isSigner":false},{"name":"signer","isMut":false,"isSigner":true},{"name":"escrow","isMut":false,"isSigner":false}],"args":[]},{"name":"rejectDeal","accounts":[{"name":"deal","isMut":true,"isSigner":false},{"name":"signer","isMut":false,"isSigner":true},{"name":"escrow","isMut":false,"isSigner":false},{"name":"projectOwner","isMut":true,"isSigner":false},{"name":"vaultTokenAccount","isMut":true,"isSigner":false},{"name":"vaultAuthority","isMut":false,"isSigner":false},{"name":"projectOwnerTokenAccount","isMut":true,"isSigner":false},{"name":"mint","isMut":false,"isSigner":false},{"name":"tokenProgram","isMut":false,"isSigner":false},{"name":"systemProgram","isMut":false,"isSigner":false},{"name":"rent","isMut":false,"isSigner":false}],"args":[]}],"accounts":[{"name":"Escrow","type":{"kind":"struct","fields":[{"name":"admin","type":"publicKey"},{"name":"escrowBump","type":"u8"}]}},{"name":"Deal","type":{"kind":"struct","fields":[{"name":"orderId","type":{"array":["u8",16]}},{"name":"projectOwner","type":"publicKey"},{"name":"kol","type":"publicKey"},{"name":"mint","type":"publicKey"},{"name":"amount","type":"u64"},{"name":"releasedAmount","type":"u64"},{"name":"vestingType","type":{"defined":"VestingType"}},{"name":"vestingDuration","type":"i64"},{"name":"startTime","type":"i64"},{"name":"acceptTime","type":"i64"},{"name":"status","type":{"defined":"DealStatus"}},{"name":"disputeReason","type":{"defined":"DisputeReason"}},{"name":"marketcapAuthorizer","type":{"option":"publicKey"}},{"name":"dealBump","type":"u8"}]}}],"types":[{"name":"VestingType","type":{"kind":"enum","variants":[{"name":"Time"},{"name":"Marketcap"}]}},{"name":"DealStatus","type":{"kind":"enum","variants":[{"name":"Created"},{"name":"Accepted"},{"name":"Rejected"},{"name":"Completed"},{"name":"Disputed"},{"name":"Resolved"}]}},{"name":"DisputeReason","type":{"kind":"enum","variants":[{"name":"None"},{"name":"Unresolved"},{"name":"Other"}]}}],"events":[{"name":"DealCreated","fields":[{"name":"orderId","type":{"array":["u8",16]},"index":false},{"name":"deal","type":"publicKey","index":false},{"name":"projectOwner","type":"publicKey","index":false},{"name":"kol","type":"publicKey","index":false},{"name":"amount","type":"u64","index":false}]},{"name":"DealStatusChanged","fields":[{"name":"orderId","type":{"array":["u8",16]},"index":false},{"name":"deal","type":"publicKey","index":false},{"name":"projectOwner","type":"publicKey","index":false},{"name":"kol","type":"publicKey","index":false},{"name":"status","type":{"defined":"DealStatus"},"index":false}]}],"errors":[{"code":6000,"name":"InvalidDealStatus","msg":"Invalid deal status"},{"code":6001,"name":"UnauthorizedSigner","msg":"Unauthorized signer"},{"code":6002,"name":"ExceedsVestedAmount","msg":"Exceeds vested amount"},{"code":6003,"name":"MissingMarketcapAuthorizer","msg":"Marketcap authorizer is missing"},{"code":6004,"name":"UnexpectedMarketcapAuthorizer","msg":"Unexpected marketcap authorizer provided"},{"code":6005,"name":"InvalidMarketcapAuthorizer","msg":"Invalid marketcap authorizer"},{"code":6006,"name":"InvalidCustomAmount","msg":"Invalid custom amount for dispute resolution"}]}

module.exports = {
  MUTUAL_ESCROW_IDL,
};