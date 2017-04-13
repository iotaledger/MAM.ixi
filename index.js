var Callable = Java.type("com.iota.iri.service.CallableRequest");
var IXIResponse = Java.type("com.iota.iri.service.dto.IXIResponse");
var ISS = Java.type("com.iota.iri.hash.ISS");
var AddressViewModel = com.iota.iri.service.viewModels.AddressViewModel;
var TransactionViewModel = com.iota.iri.service.viewModels.TransactionViewModel;
var Converter = com.iota.iri.service.utils.Converter;
var Hash = com.iota.iri.model.Hash;

print("MAM ixi started... ");

/*
function generateMerkleKeys (request) {
    var seed = request.get("seed");
    var start = parseInt(request.get("start"));
    var count = parseInt(request.get("count"));
    var size = parseInt(request.get("size"));
    var root = ISS.createMerkleTree(seed, start, count, size);
    return IXIResponse.create({
        merkleTree: root
    });
}
*/
function Signature(trits) {
    this.signature = trits;
}
function MAMBundle(bundle) {
    function getMessage() {
        var message = Arrays.stream(bundle.transactions)
            .map(function(tx) tx.getSignature())
            .reduce(function(acc, sig) acc.push(sig))
            .orElse(null);
    }
    function checkSignature(message) {

    }
    function isValidMAM() {
        var normalizedMessage = getNormalizedMessage();
    }
    function getTail() {
    }
    function getSignature() {
    }

    this.bundle = bundle;
    this.tail = getTail();
    this.message = getMessage();
    this.signature = getSignature();
}

function getBundleMessage(bundle) {
    if(bundleIsValidMAM(bundle)) {
    }
}

function hashHasIndex(hash, index) {
    return index == Converter.longValue(TransactionViewModel.fromHash(hash).trits(),
        TransactionViewModel.TAG_TRINARY_OFFSET,
        TransactionViewModel.TAG_TRINARY_SIZE)
}

function getMessage(request) {
    var channelId, index, channel, transactions, hashes, hash, tailTransaction, bundle, message;
    channelId = new Hash(request.get("channel"))
    index = parseInt(request.get("index"))
    channel = new AddressViewModel(channelId);
    hashes = channel.getTransactionHashes();
    hash = hashes.filter(function(h) hashHasIndex(h, index)).findAny().orElse(null);
    if(hash != null) {
        tailTransaction = TransactionViewModel.fromHash(hash);
        bundle = tailTransaction.getBundle();
        message = getMAMBundle(new BundleValidator(bundle));
        if(message != null) {

        }
    }
}

API.put("getMessage", new Callable({call: getMessage}));

API.put("generateMerkleKeys", new Callable({call: generateMerkleKeys}));

/*
API.put("getParser", new Callable({
  call: function(req) {
    var IntArray = Java.type("int[]");
    var out = new IntArray(Math.floor(Math.random()*9)+1);
    out[0] = 2;
    var r = IXIResponse.create({
        myArray: out,
        name: "Foo"
    });
    return r;
  }
}));
*/
