var bcrypt = require('bcrypt');

bcrypt.genSalt(10, function (err, salt) {
	if(err){
		return console.log('Failed to register administrator.');
	}else{
		bcrypt.hash('123456', salt, function (err, hash) {
					if(err){
						return console.log('Failed to register administrator.');
					}else{
						password = hash;
						return console.log(password);
					}
				});
	}
});

//{"administrator":{"name":"rajkumarsoy","password":"$2a$10$1wT.mYmbm6IEf4PP.OXoxOudUuLcBSXYlBOcKPBqKlLtqIlH3bNOC"}}
