var iri = com.iota.iri;
var Callable = iri.service.CallableRequest;
var Response = iri.service.dto.IXIResponse;
var Error = iri.service.dto.ErrorResponse;
var ISS = iri.hash.ISS;
var Transaction = iri.controllers.TransactionViewModel;
var Hashes = iri.controllers.HashesViewModel;
var Bundle = iri.BundleValidator;
var Converter = iri.utils.Converter;
var Hash = iri.model.Hash;

print("MAM extension started... ");

function getMessageFromBundle(bundle, verify) {
    print("Hello, bundle.")
    print("Bundle size: " + bundle.getTransactions().size())
    return bundle.getTransactions().stream()
        .filter(function (l) { return l.size() > 1 })
        .map(function (transactions) {
            var out = {};
            print("Hello, trytes.")
            if (verify) {
                var tail = transactions.remove(0);
                var signature = tail.getSignature();
                var merkleHashes = transactions.remove(0).getSignature();
                var hashEnd = 0;
                var index = Converter.longValue(tail.getTagValue().trits(), 0, 15);
                for (var i = 0; i < merkleHashes.length; i += Hash.SIZE_IN_TRITS) {
                    if (new Hash(Arrays.copyOfRange(merkleHashes, i, i + Hash.SIZE_IN_TRITS)).equals(Hash.NULL_HASH)) {
                        break;
                    } else {
                        hashEnd++;
                    }
                }
                var curl = new Curl();
                var message = transactions.stream().map(function (t) { t.getSignature() }).reduce(function (a, b) { return ArrayUtils.addAll(a, b) }).orElse(null);
                var hash = new int[Hash.SIZE_IN_TRITS];
                curl.absorb(message, 0, message.length);
                curl.squeeze(hash, 0, Hash.SIZE_IN_TRITS);
                var root = ISS.getMerkleRoot(ISS.address(ISS.digest(Arrays.copyOf(ISS.normalizedBundle(hash),
                    ISS.NUMBER_OF_FRAGMENT_CHUNKS), signature)), merkleHashes, 0, index, hashEnd);
                out.signature = Converter.trytes(signature);
                out.tree = Converter.trytes(merkleHashes);
                out.address = Converter.trytes(root);
            }
            out.message = transactions.stream().map(function (tx) { return Converter.trytes(tx.getSignature())}).toArray();
            out.index = Converter.longValue(transactions.get(0).trits(), Transaction.TAG_TRINARY_OFFSET, 15);
            return Response.create(out);
        }).findFirst()
        .orElse(Error.create("Bundle not valid"));
}

function hashHasIndex(hash, index) {
    return index == Converter.longValue(Transaction.fromHash(hash).trits(),
        Transaction.TAG_TRINARY_OFFSET,
        Transaction.TAG_TRINARY_SIZE)
}

function getMessage(request) {
    var channelString, indexString, channelId, index, channel, transactions, hashes, hash, tailTransaction, bundle, message;
    channelString = request.get("channel");
    if (channelString == null) {
        return Error.create("Must define `channel`");
    }
    var verify = request.get("verify") != null;
    if (verify) {
        indexString = request.get("index");
        if (indexString == null) {
            return ErrorResponse.create("Must define `index`");
        }
    }
    channelId = new Hash(channelString);
    index = parseInt(indexString);
    channel = com.iota.iri.controllers.HashesViewModel.load(channelId);
    hashes = channel.getHashes();
    var messageTransaction = hashes.stream().map(function (h) { return Transaction.fromHash(h) })
        .filter(function (tx) { return !verify || Converter.longValue(tx.trits(), Transaction.TAG_TRINARY_OFFSET, 15) == index })
        .findFirst().orElse(null);

    if (messageTransaction == null) {
        return Error.create("Message not found.");
    }
    return getMessageFromBundle(Bundle.load(messageTransaction.getBundle()), verify);
}

API.put("getMessage", new Callable({ call: getMessage }));
