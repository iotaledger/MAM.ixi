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

function getMessage(request) {
  var channelID;
  channelID = request.get("channel");
  if (channelID == null) {
    return Error.create("Must define `channel`");
  }
  var out = Hashes.load(new Hash(channelID)).getHashes().stream()
    .map(function (h) { return Transaction.quietFromHash(h) })
    .map(function (tx) { return tx.getBundleHash() })
    .distinct()
    .map(function (bh) { return Hashes.load(bh) })
    .map(function (hashes) { return Bundle.load(hashes) })
    .map(function (bundle) { return bundle.getTransactions().stream()
        .map(function (transactions) {
          print("hello, tx")
          print(transactions.size())
          out = {
            message: transactions.stream().map(function (tx) { return Converter.trytes(tx.getSignature())}).toArray(),
            index: Converter.longValue(transactions.get(0).trits(), Transaction.TAG_TRINARY_OFFSET, 15)
          }
          print("index: " + out.index);
          return out;
        }).findFirst().orElse(null);//.toArray();
    })
    .toArray();
  if (out == null || out.length == 0) {
    return Error.create("Message not found.");
  }
  print(out[0]);
  return Response.create(out);
}

API.put("getMessage", new Callable({ call: getMessage }));
