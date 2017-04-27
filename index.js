var Callable = Java.type("com.iota.iri.service.CallableRequest");
var IXIResponse = Java.type("com.iota.iri.service.dto.IXIResponse");
var ErrorResponse = Java.type("com.iota.iri.service.dto.ErrorResponse");
var ISS = Java.type("com.iota.iri.hash.ISS");
var AddressViewModel = com.iota.iri.controllers.AddressViewModel;
var TransactionViewModel = com.iota.iri.controllers.TransactionViewModel;
var BundleValidator = com.iota.iri.BundleValidator;
var Converter = com.iota.iri.utils.Converter;
var Hash = com.iota.iri.model.Hash;

print("MAM extension started... ");

function getMessageFromBundle(channelBundle) {
    var bundleValidator = new BundleValidator(channelBundle);
    var signatureTrits = bundleValidator.getTransactions().stream().filter(function(l) l.size() > 1).map(function(transactions) {
        var tail = transactions.remove(0);
        var signature = tail.getSignature();
        var merkleHashes = transactions.remove(0).getSignature();
        var hashEnd = 0;
        var index = Converter.longValue(tail.getTagValue().trits(), 0, 15);
        for(var i = 0; i < merkleHashes.length; i+= Hash.SIZE_IN_TRITS) {
            if(new Hash(Arrays.copyOfRange(merkleHashes, i, i + Hash.SIZE_IN_TRITS)).equals(Hash.NULL_HASH)) {
                break;
            } else {
                hashEnd++;
            }
        }
        var curl = new Curl();
        var message = transactions.stream().map(function(t) t.getSignature()).reduce(function(a, b) ArrayUtils.addAll(a,b)).orElse(null);
        var hash = new int[Hash.SIZE_IN_TRITS];
        curl.absorb(message, 0, message.length);
        curl.squeeze(hash, 0, Hash.SIZE_IN_TRITS);
        var root = ISS.getMerkleRoot(ISS.address(ISS.digest(Arrays.copyOf(ISS.normalizedBundle(hash),
            ISS.NUMBER_OF_FRAGMENT_CHUNKS), signature)), merkleHashes, 0, index, hashEnd);

        return IXIResponse.create({
            signature: Converter.trytes(signature),
            tree: Converter.trytes(merkleHashes),
            address: Converter.trytes(root),
            message: Converter.trytes(message),
        });
    }).findFirst().orElse(ErrorResponse.create("Could not find message"));
}

function hashHasIndex(hash, index) {
    return index == Converter.longValue(TransactionViewModel.fromHash(hash).trits(),
        TransactionViewModel.TAG_TRINARY_OFFSET,
        TransactionViewModel.TAG_TRINARY_SIZE)
}

function getMessage(request) {
    print("message get started");
    var channelString, indexString, channelId, index, channel, transactions, hashes, hash, tailTransaction, bundle, message;
    channelString = request.get("channel");
    if(channelString == null) {
        return ErrorResponse.create("Must define `channel`");
    }
    indexString = request.get("index");
    if(indexString == null) {
        return ErrorResponse.create("Must define `index`");
    }
    channelId = new Hash(channelString);
    index = parseInt(indexString);
    channel = new AddressViewModel(channelId);
    hashes = channel.getTransactionHashes();
    var messageTransaction = java.util.Arrays.stream(hashes).map(function(h) {
        return TransactionViewModel.fromHash(h);
    }).filter(function(tx) {
        return Converter.longValue(tx.trits(), TransactionViewModel.TAG_TRINARY_OFFSET, 15) == index;
    }).findFirst().orElse(null);

    if(messageTransaction == null) {
        return ErrorResponse.create("Message not found.");
    }
    return getMessageFromBundle(messageTransaction.getBundle());
}

API.put("getMessage", new Callable({call: getMessage}));
