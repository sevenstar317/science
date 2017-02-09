var countPerPage = 25;
var curPage = 1;
var lastPage = 1;
var table_id = '.table';

function resetPageCount(tb_id) {
	table_id = (typeof tb_id === 'undefined') ? '.table' : tb_id;

	// remove old page steps
	var start, end;
	start = curPage - 2;
	if (start > lastPage - 4)
		start = lastPage - 4;
	if (start <= 0)
		start = 1;

	end = curPage + 2;
	if (end < 5)
		end = 5;
	if (end > lastPage)
		end = lastPage;

	for (var i = start; i <= end; i++) {
		var id = '.page-' + i;
		$(id).remove();
	}

	countPerPage = 25;
	curPage = 1;
	lastPage = 1;

	$('#count-per-page').val(countPerPage);

	changeCountPerPage();
}

function changeCountPerPage() {
	countPerPage = $('#count-per-page').val() * 1;
	if (countPerPage == -1)
		countPerPage = totalCount;

	// remove old page steps
	var start, end;
	start = curPage - 2;
	if (start > lastPage - 4)
		start = lastPage - 4;
	if (start <= 0)
		start = 1;

	end = curPage + 2;
	if (end < 5)
		end = 5;
	if (end > lastPage)
		end = lastPage;

	for (var i = start; i <= end; i++) {
		var id = '.page-' + i;
		$(id).remove();
	}

	lastPage = (totalCount + countPerPage - 1) / countPerPage >> 0;
	goToPage(1);
}

function goToPage(page, tb_id){
	
	table_id = (typeof tb_id === 'undefined') ? '.table' : tb_id;

	var toPage = curPage;
	var start, end;

	if (page == 'first')
		toPage = 1;
	else if (page == 'prev' && curPage > 1)
		toPage--;
	else if (page == 'next' && curPage < lastPage)
		toPage++;
	else if (page == 'last')
		toPage = lastPage;
	else {
		toPage = page * 1;
	}

	// remove old page steps
	start = curPage - 2;
	if (start > lastPage - 4)
		start = lastPage - 4;
	if (start <= 0)
		start = 1;

	end = curPage + 2;
	if (end < 5)
		end = 5;
	if (end > lastPage)
		end = lastPage;

	for (var i = start; i <= end; i++) {
		var id = '.page-' + i;
		$(id).remove();
	}

	// add new page steps
	start = toPage - 2;
	if (start > lastPage - 4)
		start = lastPage - 4;
	if (start <= 0)
		start = 1;

	end = toPage + 2;
	if (end < 5)
		end = 5;
	if (end > lastPage)
		end = lastPage;

	for (var i = start; i <= end; i++) {
		var html;
		if (i == toPage)
			html = '<a class="btn btn-default page-selected page-' + i + '" disabled>' + i + '</a>';
		else
			html = '<a href="#" class="btn btn-default page-' + i + '" title="Page ' + i + '" onclick="goToPage(\'' + i + '\', \'' +table_id +'\')">' + i + '</a>';

		$(html).insertBefore($('.page-next'));
	}

	if (toPage <= 1) {
		$('.page-first').attr('disabled', 'true');
		$('.page-prev').attr('disabled', 'true');
	} else {
		$('.page-first').removeAttr('disabled');
		$('.page-prev').removeAttr('disabled');
	}

	if (toPage >= lastPage) {
		$('.page-next').attr('disabled', 'true');
		$('.page-last').attr('disabled', 'true');
	} else {
		$('.page-next').removeAttr('disabled');
		$('.page-last').removeAttr('disabled');
	}

	curPage = toPage
	start = (curPage - 1) * countPerPage + 1;
	if (start > totalCount)
		start = totalCount;

	end = curPage * countPerPage;
	if (end > totalCount)
		end = totalCount;
	
	$('#show-info').text(start + ' to ' + end + ' of Total ' + totalCount);
	$(table_id + ' tbody tr').addClass('hidden');

	for (var i = start; i <= end; i++) {
		var id = table_id + ' #item-' + i;
		$(id).removeClass('hidden');
	}
}

$(document).ready(function(){
	lastPage = (totalCount + countPerPage - 1) / countPerPage >> 0;
	goToPage(curPage);
});
