var iri = com.iota.iri;
var Callable = iri.service.CallableRequest;
var Response = iri.service.dto.IXIResponse;
var Error = iri.service.dto.ErrorResponse;
var ISS = iri.hash.ISS;
var Transaction = iri.controllers.TransactionViewModel;
var Address = iri.controllers.AddressViewModel;
var Bundle = iri.controllers.BundleViewModel;
var BundleValidator = iri.BundleValidator;
var Converter = iri.utils.Converter;
var Hash = iri.model.Hash;

print("MAM extension started... ");

function getMessage(request) {
  var channelID;
  channelID = request.get("channel");
  if (channelID == null) {
    return Error.create("Must define `channel`");
  }
  var out = Address.load(IOTA.tangle, new Hash(channelID)).getHashes().stream()
    .map(function (h) { return Transaction.quietFromHash(IOTA.tangle, h) })
    .map(function (tx) { return tx.getBundleHash() })
    .distinct()
    .map(function (bh) { return BundleValidator.validate(IOTA.tangle, bh) })
    .map(function (bundleTransactions) { return bundleTransactions.stream()
        .map(function (transactions) {
          print(transactions.size())
          out = {
            message: transactions.stream().map(function (tx) { return Converter.trytes(tx.getSignature())}).toArray(),
            tag: Converter.trytes(transactions.get(0).trits(), Transaction.TAG_TRINARY_OFFSET, Transaction.TAG_TRINARY_SIZE)
          }
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
