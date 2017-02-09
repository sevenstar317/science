var schoolCnt = 0, loadedCnt = 0;
var markers = [];
var schoolSelectMode = 'none';
var selectedSchool = {
	'name': '',
	'addr': '',
	'city': '',
	'postalcode': '',
	'country': ''
};
var manualSchool = {
	'name': '',
	'addr': '',
	'city': '',
	'postalcode': '',
	'country': ''
};

var preDictions = [];
var prevInput = '';
var delayCount = 0;
var curTimeStamp = 0;

function buildSchoolList() {
	showSchoolList();

	var html = '<li class="list-group-item list-school-item school-loading center">';
	html += '<p class="wait-mark">';
	html += '<span class="wait-animate glyphicon glyphicon-refresh glyphicon-refresh-animate"></span>';
	html += '&nbsp;&nbsp;Loading...</p></li>';
	loadedCnt = 0;
	$('.list-school').empty();
	$('.list-school').append($(html));

	schoolSelectMode = 'none';
	selectedSchool.name = '';
	selectedSchool.addr = '';
	selectedSchool.city = '';
	selectedSchool.postalcode = '';
	selectedSchool.country = '';

	$.ajax({
		url: '/getschools',
		type: 'GET',
		data: {'lat': lat, 'lng': lng},
		contentType : "application/json;charset=utf-8",
		success: function(res){
			console.log(res);
			parseSchools(res);
		}
	});
}

function setAutoComplete(){
	$( "#search" ).autocomplete({
		source: function( request, response ) {
			var matcher = new RegExp( $.ui.autocomplete.escapeRegex( request.term ), "i" );
			response( $.grep( preDictions, function( value ) {
				value = value.label || value.value || value;
				return matcher.test( value )
			}));
		}
	});
}

function getPreDictions() {
	delayCount--;
	if (delayCount < 0)
		delayCount = 0;
	if (delayCount > 0)
		return;

	var input = $('#search').val();
	if (input == '') {
		preDictions = [];
		return;
	} else if (input == prevInput)
		return;

	prevInput = input;
	$.ajax({
		url: '/autocomplete',
		type: 'GET',
		data: {'input': input},
		contentType : "application/json;charset=utf-8",
		success: function(res){
			if (res.status_code == 200 &&
				res.timestamp > curTimeStamp)
			{
				curTimeStamp = res.timestamp;
				preDictions = res.predictions;
				$( "#search" ).autocomplete('search', res.input);
			}
		}
	});
}

function loadImage() {
	var ctx = document.getElementById('photo-canvas').getContext('2d');
	var img = new Image;
	var maxWidth = 160, maxHeight = 160;
	var imgWidth, imgHeight;
	var drawWidth, drawHeight;
	var x, y, rate;

	

	img.src = URL.createObjectURL(imgFile);
	img.onload = function() {
		imgWidth = img.width;
		imgHeight = img.height;
		if (imgWidth > imgHeight)
			rate = maxWidth / imgWidth;
		else
			rate = maxHeight / imgHeight;

		drawWidth = imgWidth * rate;
		drawHeight = imgHeight * rate;
		x = (maxWidth - drawWidth) / 2;
		y = (maxHeight - drawHeight) / 2;


		ctx.clearRect(0, 0, maxWidth, maxHeight);
		ctx.drawImage(img, 0, 0, imgWidth, imgHeight, x, y, drawWidth, drawHeight);
		$('#photo-removed').val('changed');
		$('.profile-photo img').attr('src', document.getElementById('photo-canvas').toDataURL("image/png"));
	}
}

$(document).ready(function(){
	insertCountries();
	setAutoComplete();
	initGeolocation(buildSchoolList);

	$('.add-manual').hide();

	$('#change-profile-image').on('click', function(){
		$('#photo').show();
		$('#photo').focus();
		$('#photo').click();
		$('#photo').hide();
	});

	$('.dropdown-toggle.selectpicker').removeClass('btn btn-default').addClass('form-control');

	$('form').submit(function(event) {
		event.preventDefault();
		$('#wait').removeClass('hidden');
		$('.alert').remove();

		var data = new FormData();
		data.append('name', $('#name').val());
		data.append('school-name', $('#school-name').val());
		data.append('school-addr', $('#school-addr').val());
		data.append('school-city', $('#school-city').val());
		data.append('school-postalcode', $('#school-postalcode').val());
		data.append('school-country', $('#school-country').val());
		data.append('syllabus', $('#syllabus').val());
		data.append('grade', $('#grade').val());
		data.append('section', $('#section').val());
		data.append('photo-removed', $('#photo-removed').val());
		data.append('password', $('#password').val());

		if ($('#photo-removed').val() == 'changed') {
			var canvas = document.getElementById('photo-canvas');
			data.append('photo', canvas.toDataURL());
		}

		$.ajax({
			url: '/profile',
			type: 'POST',
			data: data,
			contentType: false,
			processData: false,
			success: function(result){
				$('#school-name').val(manualSchool.name);
				$('#school-addr').val(manualSchool.addr);
				$('#school-city').val(manualSchool.city);
				$('#school-postalcode').val(manualSchool.postalcode);
				$('#school-country').val(manualSchool.country);
				$('#school-country').next().find('.filter-option').text(manualSchool.country);
				$('#wait').addClass('hidden');

				responseProfile(result);
			}
		});
	});

	/* search */
	$('#search').keydown(function(e) {
		if (e.which == 13) {
			$( "#search" ).autocomplete('close');
			filterSchools();
		} else if (e.which >= 37 && e.which <= 40)
			return;
		else {
			delayCount++;
			setTimeout (
				function(){
					getPreDictions();
				},
				500
			);
		}
	});

	$('#school-name').keydown(function(e){
		if (e.which == 13)
			$('#school-addr').focus();
	});

	$('#school-addr').keydown(function(e){
		if (e.which == 13)
			$('#school-city').focus();
	});

	$('#school-city').keydown(function(e){
		if (e.which == 13)
			$('#school-postalcode').focus();
	});

	$('#school-postalcode').keydown(function(e){
		if (e.which == 13)
			$('#school-country').next().find('.selectpicker').focus();
	});

	$('#photo').change(function(e) {
		imgFile = e.target.files[0];
	});
	//console.log(pos);
	//filterSchools(pos);
});

function showMap(){
	$('#map_canvas').show();
	$('.list-school').hide();
	//$('.btn-map').hide();
	$('.btn-list').show();
	$('.add-manual').hide();
	google.maps.event.trigger(map, 'resize');
}

function showSchoolList(){
	$('.add-manual').hide();
	$('#map_canvas').hide();
	$('.list-school').show();
	$('.btn-map').show();
	//$('.btn-list').hide();
	$('#search-block').show();
	$('.btn-add-manually').show();

	if (selectedSchool.name == '')
		schoolSelectMode == 'none';
	else
		schoolSelectMode == 'auto';
}

function showAddManual(){
	schoolSelectMode = 'manual'
	$('.add-manual').show();
	$('#map_canvas').hide();
	$('.list-school').hide();
	//$('.btn-map').hide();
	$('.btn-list').show();
	//$('.btn-add-manually').hide();
	//$('#search-block').hide();
}

function selectDropdownItem(item, id){
	$(item).parent().parent().prev().find('.selected-item').text($(item).text());
	$(item).parent().parent().next().val(id);
}

function saveProfile(){
	manualSchool.name = $('#school-name').val();
	manualSchool.addr = $('#school-addr').val();
	manualSchool.city = $('#school-city').val();
	manualSchool.postalcode = $('#school-postalcode').val();
	manualSchool.country = $('#school-country').val();

	if (schoolSelectMode == 'auto'){
		$('#school-name').val(selectedSchool.name);
		$('#school-addr').val(selectedSchool.addr);
		$('#school-city').val(selectedSchool.city);
		$('#school-postalcode').val(selectedSchool.postalcode);
		$('#school-country').val(selectedSchool.country);
		$('#school-country').next().find('.filter-option').text(selectedSchool.country);
	}

	$('form').validator('validate');
	setTimeout (
		function(){
			if ($('.has-error').length > 0)
				return;

			$('form').submit();
		},
		100
	);
}

function responseProfile(res) {
	if (res.status_code == 200 ) {
		$(location).attr('href', '/profile/view');
	} else {
		var alertElem = '<div class="alert alert-danger alert-dismissable">';
		alertElem += '<button type="button" data-dismiss="alert" aria-hidden="true" class="close">&times;</button>';
		alertElem += '<strong>Error!</strong><p>' + res.message + '</p></div>';
		$('#alert-block').append(alertElem);
	}
}

function parseSchools(res){

	if (res.status_code == 400 )
		return;
	//console.log(res);
	schoolCnt = res.schools.length;

	for (var i = 0; i < schoolCnt; i++) {
		var school = res.schools[i];
		if (!school.reference)
			continue;

		$.ajax({
			url: '/getschool',
			type: 'GET',
			data: {'reference': school.reference},
			contentType : "application/json;charset=utf-8",
			success: function(result){
				console.log(result);
				parseSchool(result);
			}
		});
	}
}

function parseSchool(res){
	loadedCnt++;
	if (schoolCnt <= loadedCnt)
		$('.list-school .school-loading').remove();

	if (res.status_code == 400)
		return;

	var address = '';
	if (res.school.address != '')
		address += res.school.address + ', ';
	if (res.school.city != '')
		address += res.school.city + ', ';
	if (res.school.postal_code != '')
		address += res.school.postal_code + ', ';
	if (res.school.country != '')
		address += res.school.country;

	var html = '<li class="list-group-item list-school-item"';
	html += ' data-school-name="' + res.school.name + '"';
	html += ' data-school-addr="' + res.school.address + '"';
	html += ' data-school-city="' + res.school.city + '"';
	html += ' data-school-postalcode="' + res.school.postal_code + '"';
	html += ' data-school-country="' + res.school.country + '"';
	html += ' onclick="selectSchool(this)">';
	html += '<p class="name">' + res.school.name + '</p>';
	html += '<p class="address">' + address + '</p>';
	html += '</li>';

	//$(html).insertBefore($('.list-school .school-loading'));
	$('.list-school').append($(html));
	console.log(html);
	if (!google)
		return;

	var latlng = new google.maps.LatLng(res.school.location.lat, res.school.location.lng);
	var infowindow = new google.maps.InfoWindow();
	var contentString = '<p class="map-info-title">' + res.school.name + '</p>';
	contentString += '<p class="map-info-desc">' + address + '</p>';
	contentString += '<button type="button" class="btn btn-default pull-right"';
	contentString += ' data-school-name="' + res.school.name + '"';
	contentString += ' data-school-addr="' + res.school.address + '"';
	contentString += ' data-school-city="' + res.school.city + '"';
	contentString += ' data-school-postalcode="' + res.school.postal_code + '"';
	contentString += ' data-school-country="' + res.school.country + '"';
	contentString += ' onclick="selectSchoolOnMap(this)">Select</button>';
	infowindow.setContent(contentString);
	
	var marker = new google.maps.Marker({
		position : latlng,
		flat : true,
		title : res.school.name,
		map : map
	});

	google.maps.event.addListener(marker, 'click', function() {
		infowindow.open(map,marker);
	});

	markers.push(marker);
}

function selectSchool(elem){
	var schoolElem = $(elem);

	if (schoolElem.hasClass('active')){
		schoolElem.removeClass('active');

		selectedSchool.name = '';
		selectedSchool.addr = '';
		selectedSchool.city = '';
		selectedSchool.postalcode = '';
		selectedSchool.country = '';

		schoolSelectMode = 'none';

		return;
	}

	schoolElem.parent().find('li').removeClass('active');
	schoolElem.addClass('active');

	selectedSchool.name = schoolElem.attr('data-school-name');
	selectedSchool.addr = schoolElem.attr('data-school-addr');
	selectedSchool.city = schoolElem.attr('data-school-city');
	selectedSchool.postalcode = schoolElem.attr('data-school-postalcode');
	selectedSchool.country = schoolElem.attr('data-school-country');

	schoolSelectMode = 'auto';
}

function selectSchoolOnMap(elem) {
	var schoolElem = $(elem);
	selectedSchool.name = schoolElem.attr('data-school-name');
	selectedSchool.addr = schoolElem.attr('data-school-addr');
	selectedSchool.city = schoolElem.attr('data-school-city');
	selectedSchool.postalcode = schoolElem.attr('data-school-postalcode');
	selectedSchool.country = schoolElem.attr('data-school-country');

	schoolSelectMode = 'auto';
}

function filterSchools(a) {
	var query = a || $('#search').val();
	var queryExp = /(.)*[^ ](.)*/;
	if (!queryExp.test(query)){
		return;
	}

	var len = markers.length;
	for (var i = 0; i < len; i++) {
		markers[i].setMap(null);
	}
	
	markers = [];
	query = query.replace(/\s/, '+');

	var html = '<li class="list-group-item list-school-item school-loading center">';
	html += '<p class="wait-mark">';
	html += '<span class="wait-animate glyphicon glyphicon-refresh glyphicon-refresh-animate"></span>';
	html += '&nbsp;&nbsp;Loading...</p></li>';
	loadedCnt = 0;
	$('.list-school').empty();
	$('.list-school').append(html);

	schoolSelectMode = 'none';
	selectedSchool.name = '';
	selectedSchool.addr = '';
	selectedSchool.city = '';
	selectedSchool.postalcode = '';
	selectedSchool.country = '';

	$.ajax({
		url: '/searchschools',
		type: 'GET',
		data: {'query': 'school+' + query},
		contentType : "application/json;charset=utf-8",
		success: function(res){
			parseSchools(res);
		}
	});
}

function insertCountries() {
	var cl = countries.length;
	var i;
	var countryElem = $('#school-country');

	for (i = 0; i < cl; i++) {
		if (countries[i] == countryElem.attr('data-selected'))
			countryElem.append('<option value="' + countries[i] + '" selected>' + countries[i] + '</option>');
		else
			countryElem.append('<option value="' + countries[i] + '">' + countries[i] + '</option>');
	}

	$('#school-country').selectpicker();
}

var countries = ['Afghanistan',
'Albania',
'Algeria',
'American Samoa',
'Andorra',
'Angola',
'Anguilla',
'Antigua And Barbuda',
'Argentina',
'Armenia',
'Aruba',
'Australia',
'Austria',
'Azerbaijan',
'Bahamas',
'Bahrain',
'Bangladesh',
'Barbados',
'Belarus',
'Belgium',
'Belize',
'Benin',
'Bermuda',
'Bhutan',
'Bolivia',
'Bonaire',
'Bosnia And Herzegovina',
'Botswana',
'Brazil',
'British Indian Ocean Ter',
'Brunei',
'Bulgaria',
'Burkina Faso',
'Burundi',
'Cambodia',
'Cameroon',
'Canada',
'Canary Islands',
'Cape Verde',
'Cayman Islands',
'Central African Republic',
'Chad',
'Channel Islands',
'Chile',
'China',
'Christmas Island',
'Cocos Island',
'Colombia',
'Comoros',
'Congo',
'Cook Islands',
'Costa Rica',
'Cote D\'Ivoire',
'Croatia',
'Cuba',
'Curacao',
'Cyprus',
'Czech Republic',
'Denmark',
'Djibouti',
'Dominica',
'Dominican Republic',
'East Timor',
'Ecuador',
'Egypt',
'El Salvador',
'Equatorial Guinea',
'Eritrea',
'Estonia',
'Ethiopia',
'Falkland Islands',
'Faroe Islands',
'Fiji',
'Finland',
'France',
'French Guiana',
'French Polynesia',
'French Southern Ter',
'Gabon',
'Gambia',
'Georgia',
'Germany',
'Ghana',
'Gibraltar',
'Great Britain',
'Greece',
'Greenland',
'Grenada',
'Guadeloupe',
'Guam',
'Guatemala',
'Guinea',
'Guyana',
'Haiti',
'Hawaii',
'Honduras',
'Hong Kong',
'Hungary',
'Iceland',
'India',
'Indonesia',
'Iran',
'Iraq',
'Ireland',
'Isle of Man',
'Israel',
'Italy',
'Jamaica',
'Japan',
'Jordan',
'Kazakhstan',
'Kenya',
'Kiribati',
'Korea North',
'Korea South',
'Kuwait',
'Kyrgyzstan',
'Laos',
'Latvia',
'Lebanon',
'Lesotho',
'Liberia',
'Libya',
'Liechtenstein',
'Lithuania',
'Luxembourg',
'Macau',
'Macedonia',
'Madagascar',
'Malaysia',
'Malawi',
'Maldives',
'Mali',
'Malta',
'Marshall Islands',
'Martinique',
'Mauritania',
'Mauritius',
'Mayotte',
'Mexico',
'Midway Islands',
'Moldova',
'Monaco',
'Mongolia',
'Montserrat',
'Morocco',
'Mozambique',
'Myanmar',
'Nambia',
'Nauru',
'Nepal',
'Netherland Antilles',
'Netherlands (Holland, Europe)',
'Nevis',
'New Caledonia',
'New Zealand',
'Nicaragua',
'Niger',
'Nigeria',
'Niue',
'Norfolk Island',
'Norway',
'Oman',
'Pakistan',
'Palau Island',
'Palestine',
'Panama',
'Papua New Guinea',
'Paraguay',
'Peru',
'Philippines',
'Pitcairn Island',
'Poland',
'Portugal',
'Puerto Rico',
'Qatar',
'Republic of Montenegro',
'Republic of Serbia',
'Reunion',
'Romania',
'Russia',
'Rwanda',
'St Barthelemy',
'St Eustatius',
'St Helena',
'St Kitts-Nevis',
'St Lucia',
'St Maarten',
'St Pierre And Miquelon',
'St Vincent And Grenadines',
'Saipan',
'Samoa',
'Samoa American',
'San Marino',
'Sao Tome And Principe',
'Saudi Arabia',
'Senegal',
'Serbia',
'Seychelles',
'Sierra Leone',
'Singapore',
'Slovakia',
'Slovenia',
'Solomon Islands',
'Somalia',
'South Africa',
'Spain',
'Sri Lanka',
'Sudan',
'Suriname',
'Swaziland',
'Sweden',
'Switzerland',
'Syria',
'Tahiti',
'Taiwan',
'Tajikistan',
'Tanzania',
'Thailand',
'Togo',
'Tokelau',
'Tonga',
'Trinidad And Tobago',
'Tunisia',
'Turkey',
'Turkmenistan',
'Turks And Caicos Is',
'Tuvalu',
'Uganda',
'Ukraine',
'United Arab Emirates',
'United Kingdom',
'United States',
'Uruguay',
'Uzbekistan',
'Vanuatu',
'Vatican City State',
'Venezuela',
'Vietnam',
'Virgin Islands (Brit)',
'Virgin Islands (USA)',
'Wake Island',
'Wallis And Futana',
'Yemen',
'Zaire',
'Zambia',
'Zimbabwe'];

