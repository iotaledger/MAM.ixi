var Callable = Java.type("com.iota.iri.service.CallableRequest");
var IXIResponse = Java.type("com.iota.iri.service.dto.IXIResponse");
var ISS = Java.type("com.iota.iri.hash.ISS");
var Converter = com.iota.iri.utils.Converter;

print("Initializing MAM... ");

function generateMerkleKeys (request) {
  var start = Date.now();
  var seed = request.get("seed");
  var start = parseInt(request.get("start"));
  var count = parseInt(request.get("count"));
  var size = parseInt(request.get("size"));
  var seedTrits = Converter.trits(seed);
  var root = ISS.createMerkleTree(seedTrits, start, count, size);
  return IXIResponse.create({
    merkleTree: root.toString(),
  });
}

API.put("generateMerkleKeys", new Callable({call: generateMerkleKeys}));
