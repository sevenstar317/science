exports.randomString = function(len) {
  var buf = []
    , chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    , charlen = chars.length;

  for (var i = 0; i < len; ++i) {
    buf.push(chars[_getRandomInt(0, charlen - 1)]);
  }

  return buf.join('');
};

function _getRandomInt(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

exports.getRandomInt = function(min, max) {
	return _getRandomInt(min, max);
};

exports.getRandomArray = function(initArray, count) {
	var retArray = [];

	if (!initArray || initArray.length <= 0 || count <= 0)
		return retArray;

	if (count >= initArray.length) {
		for (var i = 0; i < initArray.length; i++) {
			var item = initArray[i];
			retArray.push(item);
		}

		return retArray;
	}

	var totalNum = initArray.length;
	var randNum = _getRandomInt(0, totalNum);

	for (var i = 0; i < count; i++) {
		var index = (randNum + i) % totalNum;
		var item = initArray[index];

		retArray.push(item);
	}

	return retArray;
}

exports.convertDateToNum = function(date) {
	if (!date)
		return 0;

	return date.getTime();
};

exports.convertHtmlTagToSpecialChar = function(text) {
	var res = text.replace(/</g, "\&lt;").replace(/>/g, "\&gt;");
	res = res.replace(/\r\n/g, "<br>").replace(/\r/g, "<br>").replace(/\n/g, "<br>");
	return res;
};

exports.trim = function(text) {
	var res = text, tmp = '';
	while (res != tmp) {
		tmp = res;
		res = res.replace(/^\s+/, "");
		res = res.replace(/^\\r/, "");
		res = res.replace(/^\\n/, "");
		res = res.replace(/^\\t/, "");
		res = res.replace(/\s+$/, "");
		res = res.replace(/\\r$/, "");
		res = res.replace(/\\n$/, "");
		res = res.replace(/\\t$/, "");
	}

	return res;
};

exports.getDomainFromUrl = function(url) {
	var start = url.indexOf('//') + 2;
	var end = url.indexOf('/', start);
	var domain;
	if (end != -1)
		domain = url.substring(start, end);
	else
		domain = url.substring(start);

	return domain;
};

