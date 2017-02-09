/*
 *	Administrator Controller
 *  @Author boris
 */

 var common = function () {
 	var SyllabusModel = require('../models/syllabus');
 	var GradeModel = require('../models/grades');
	var ChapterModel = require('../models/chapters');
	var ConceptModel = require('../models/concepts');
	var VideoModel = require('../models/videos');
	var ReferenceModel = require('../models/references');
	var NoteModel = require('../models/notes');
	var ReportModel = require('../models/reports');
	var UserModel = require('../models/users');
	var LogModel = require('../models/logs');
	var LinkModel = require('../models/links');
	var utils = require('../utils');

 	var async = require('async');
 	var logger = require('tracer').colorConsole();

 	var getSyllabus = function (id, callback) {

			if (!id || id == '') {
				logger.trace('Item id is empty.');

				if (callback)
					callback(null);

				return;
			}

			SyllabusModel.findOne({
				'_id': id
			}, function(err, syllabus){
				if (err || !syllabus) {
					logger.trace('Failed get syllabus. Id[%s]', id);
					if (err)
						logger.trace('ErrMassage : %s', err.message);

					if (callback)
						callback(null);

					return;
				} else {
					if (callback)
						callback(syllabus);
					return;
				}
			});
		},
		getGrade = function (id, callback) {

			if (!id || id == '') {
				logger.trace('Item id is empty.');

				if (callback)
					callback(null);

				return;
			}

			GradeModel.findOne({
				'_id': id
			}, function(err, grade){
				if (err || !grade) {
					logger.trace('Failed get grade. Id[%s]', id);
					if (err)
						logger.trace('ErrMassage : %s', err.message);

					if (callback)
						callback(null);

					return;
				} else {
					if (callback)
						callback(grade);
					return;
				}
			});
		},
		getChapter = function (id, callback) {

			if (!id || id == '') {
				logger.trace('Item id is empty.');

				if (callback)
					callback(null);

				return;
			}

			ChapterModel.findOne({
				'_id': id
			}, function(err, chapter){
				if (err || !chapter) {
					logger.trace('Failed get chapter. Id[%s]', id);
					if (err)
						logger.trace('ErrMassage : %s', err.message);

					if (callback)
						callback(null);

					return;
				} else {
					if (callback)
						callback(chapter);
					return;
				}
			});
		},
		getConcept = function (id, callback) {

			if (!id || id == '') {
				logger.trace('Item id is empty.');

				if (callback)
					callback(null);

				return;
			}

			ConceptModel.findOne({
				'_id': id
			}, function(err, concept){
				if (err || !concept) {
					logger.trace('Failed get concept. Id[%s]', id);
					if (err)
						logger.trace('ErrMassage : %s', err.message);

					if (callback)
						callback(null);

					return;
				} else {
					if (callback)
						callback(concept);
					return;
				}
			});
		},
		getScientists = function () {
			var retLst = [];
			var baseLst = [
				{
					'name': 'Prafulla Chandra Ray',
					'photo': 'http://shlok.mobi/appimg/Famous-Indian-Scientists/2.jpg'
				},{
					'name': 'C. V. Raman',
					'photo': 'http://upload.wikimedia.org/wikipedia/commons/e/e6/Sir_CV_Raman.JPG'
				},{
					'name': 'Homi Jehangir Bhabha',
					'photo': 'http://im.rediff.com/news/2009/sep/03slide9.jpg'
				},{
					'name': 'Jagadish Chandra Bose',
					'photo': 'http://www.ajcbosecollege.org/images/index_09.jpg'
				},{
					'name': 'Har Gobind Khorana',
					'photo': 'http://im.rediff.com/news/2011/nov/24khorana2.jpg'
				},{
					'name': 'Subrahmanyan Chandrasekhar',
					'photo': 'http://geosci.uchicago.edu/i/subrahmanyanchandrasekhar.jpg'
				},{
					'name': 'Isaac Newton',
					'photo': 'http://img.bhs4.com/b8/8/b88c7acf597c0cac11f582076b090928f0286200_large.jpg'
				},{
					'name': 'Albert Einstein',
					'photo': 'http://upload.wikimedia.org/wikipedia/commons/d/d3/Albert_Einstein_Head.jpg'
				},{
					'name': 'Nikola Tesla',
					'photo': 'http://jeweell.com/data_images/out/10/1127934-nikola-tesla.jpg'
				},{
					'name': 'Galileo Galilei',
					'photo': 'http://todayinsci.com/G/Galilei_Galileo/GalileiGalileo-Cresti300px.jpg'
				},{
					'name': 'Leonardo da Vinci',
					'photo': 'http://www.customasapblog.com/wp-content/uploads/2011/11/da-vinci-alam_159842t.jpg'
				},{
					'name': 'Max Planck',
					'photo': 'https://theologiansinc.files.wordpress.com/2012/09/h4160317-max_planck_german_physicist-spl.jpg'
				},{
					'name': 'Charles Darwin',
					'photo': 'http://www.amnh.org/var/ezflow_site/storage/images/media/amnh/images/our-research/science-news/charles-darwin/350943-1-eng-US/charles-darwin_large.jpg'
				},{
					'name': 'Niels Bohr',
					'photo': 'http://upload.wikimedia.org/wikipedia/commons/6/6d/Niels_Bohr.jpg'
				},{
					'name': 'Marie Curie',
					'photo': 'http://www.mcg-re.de/mcg/index.php?file=1156'
				},{
					'name': 'Aristotle',
					'photo': 'http://shortbiography.org/wp-content/uploads/2014/06/Aristotle.jpg'
				},{
					'name': 'Louis Pasteur',
					'photo': 'http://media-2.web.britannica.com/eb-media/00/3400-004-8337FE09.jpg'
				},{
					'name': 'Thomas Edison',
					'photo': 'http://www.dumblittleman.com/wp-content/uploads/2014/04/1-75.jpg'
				},{
					'name': 'Henry Cavendish',
					'photo': 'http://www.nndb.com/people/030/000083778/henry-cavendish-1.jpg'
				},{
					'name': 'Edward Jenner',
					'photo': 'http://ichef.bbci.co.uk/arts/yourpaintings/images/paintings/well/large/cdn_well_v_23503_large.jpg'
				},{
					'name': 'Richard Feynman',
					'photo': 'http://www.nndb.com/people/584/000026506/feynman.jpg'
				},{
					'name': 'Nicolaus Copernicus',
					'photo': 'http://viola.bz/wp-content/uploads/2013/02/Nicolaus-Copernicus-540-3.jpg'
				},{
					'name': 'William Harvey',
					'photo': 'http://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/William_Harvey-Foto.jpg/220px-William_Harvey-Foto.jpg'
				},{
					'name': 'Gregor Mendel',
					'photo': 'http://vignette2.wikia.nocookie.net/obluda/images/e/eb/Gregor_Mendel.jpg/revision/latest?cb=20130830104009'
				},{
					'name': 'Ernest Rutherford',
					'photo': 'http://media.web.britannica.com/eb-media/86/101086-004-41BFE1A3.jpg'
				},{
					'name': 'John Dalton',
					'photo': 'http://pioneros.puj.edu.co/biografias/img/jhon_dalton.jpg'
				},{
					'name': 'Sigmund Freud',
					'photo': 'http://www.chmc-dubai.com/img/Sigmund_Freud/Sigmund%20Freud.jpg'
				},{
					'name': 'Dmitry Mendeleev',
					'photo': 'http://www.studyhelpline.net/Biography/images/Dmitri-Mendeleev.jpg'
				},{
					'name': 'Archimedes',
					'photo': 'http://www.kozanbilgi.net/wp-content/uploads/Archimedes.jpg'
				},{
					'name': 'Alexander Grahambell',
					'photo': 'http://upload.wikimedia.org/wikipedia/commons/1/10/Alexander_Graham_Bell.jpg'
				},{
					'name': 'Benjamin Franklin',
					'photo': 'http://www.dumblittleman.com/wp-content/uploads/2014/04/1-50.jpg'
				},{
					'name': 'Michael Faraday',
					'photo': 'http://www.nndb.com/people/571/000024499/faraday9.jpg'
				},{
					'name': 'Johannes Kepler',
					'photo': 'http://i379.photobucket.com/albums/oo232/vladislaw_photo/Johannes_Kepler_1610a.jpg'
				},{
					'name': 'Robert Hooke',
					'photo': 'http://upload.wikimedia.org/wikipedia/commons/1/19/Jan_Baptist_van_Helmont_portrait.jpg'
				},{
					'name': 'Antoine Lavoisier',
					'photo': 'http://naturale-solutions.com/images/lavoisier.jpg'
				},{
					'name': 'Robert Boyle',
					'photo': 'http://www.independent.co.uk/migration_catalog/article5224854.ece/alternates/w620/robert-boyle-p17.jpeg'
				},{
					'name': 'Enrico Fermi',
					'photo': 'https://solmagazine.files.wordpress.com/2012/07/fermi-quotestemple-com-pic.jpg'
				}
			];

			retLst = utils.getRandomArray(baseLst, 4);

			return retLst;
		}
		blankFunction = function() {
		};

	return {
		getSyllabus: getSyllabus,
		getGrade: getGrade,
		getChapter: getChapter,
		getConcept: getConcept,
		getScientists: getScientists,
	};
 }();

 module.exports = common;

