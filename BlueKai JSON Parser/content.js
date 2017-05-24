var processPathReturn = function(id, inventoryModalId) {
	return function(data, textStatus, jqXHR) {
		var s = data.split("</tr>");
		if (data.includes("BlueKai Authentication")) {
			taxonomyPath = "Not logged in...";
		} else {
			var taxonomyPath = s[1].split("<td>")[21].replace("</td>", "");

		}
		var span = $('#' + id);
		span[0].innerHTML = taxonomyPath;

		var inventoryTitle = $('#' + inventoryModalId + '-title');

		inventoryTitle[0].innerHTML = taxonomyPath;

	};
};

var processRulesReturn = function(id) {
	return function(data, textStatus, jqXHR) {

		var rules = "";
		var s = data.split("</tr>");
		if (data.includes("BlueKai Authentication")) {
			rules = "Not logged in...";
		} else {
			rules = s[1].split("<td>")[4].replace("</td>", "");
			if (rules.includes("<b>Rule</b>")) {
				// this is hit when no rules are returned in the table.
				rules = "";
			}

		}
		var span = $('#' + id);
		span[0].innerHTML = rules;

	};
};

var processInventoryReturnCallback = function(inventoryReturnCatId) {
	return function(data, textStatus, jqXHR) {
		localStorageSet('inventory-' + inventoryReturnCatId, data);
		localStorageSetDate('inventory-' + inventoryReturnCatId + '-timestamp', new Date());
		processInventoryReturn(inventoryReturnCatId, data, textStatus)
	};
};

function processInventoryReturn(inventoryReturnCatId, data, textStatus) {
	console.log("Processing inventory return " + inventoryReturnCatId);
	console.log("Status: " + textStatus);

	var timestamp = localStorageGetDate('inventory-' + inventoryReturnCatId + '-timestamp');

	console.log("Inventory timestamp: " + timestamp);

	var rules = "";

	var start = data.indexOf('<table class="style7">');

	var end = data.length - 62;

	var s = data.substring(start, end);

	s = s.replace('<table class="style7">', '<table class="table table-striped">');
	s = s.replace('<td class="style3" align="center">Date</td>', '<th>Date</th>');
	s = s.replace('<td class="style3" align="center">Provider</td>', '<th>Provider</th>');
	s = s.replace('<td class="style3" align="center">SiteID</td>', '<th>Site ID</th>');
	s = s.replace('<td class="style3" align="center">Site</td>', '<th>Site</th>');
	s = s.replace('<td class="style3" align="center">Category</td>', '');
	s = s.replace('<td class="style3" align="center">Issued</td>', '<th>Issued</th>');

	var contentDivId = 'inventory-modal-' + inventoryReturnCatId + '-content';

	var div = $('#' + contentDivId);

	div[0].innerHTML = '';

	var table = $(s);

	table.find('tr').each(function(i, el) {
		var $tds = $(this).find('td');
		$tds.eq(4).remove();
	});

	div.append(table);

	// enabled the view buttons for this category

	var viewBtns = $("[id^=inventory-view]");

	for (var i = 0; i < viewBtns.length; i++) {

		var btnId = viewBtns[i].id;
		var btnCatId = btnId.split("-")[3];
		var btnCampId = btnId.split("-")[2];
		if (btnCatId == inventoryReturnCatId) {
			// console.log('enable button: ' + btnId);
			$('#' + btnId).prop('disabled', false);
			$('#inventory-timestamp-' + btnCampId + '-' + btnCatId)[0].innerHTML = timestamp.toISOString().replace("T",
					" ").substring(0, 19);
		}
	}

	// display the timestamp for the retrieved categories

	updateRetrieveBtns(inventoryReturnCatId, false, "Retrieve", "Retrieve");
}

function localStorageSet(key, value) {
	localStorage.setItem('bluekai-json-parser.' + key, value);
	// console.log("setting local storage: " + key + " / " + value.substring(0,
	// 50));
}

function localStorageSetDate(key, date) {
	var value = date.toISOString();
	localStorageSet(key, value);
}

function localStorageGet(key) {
	var result = localStorage.getItem('bluekai-json-parser.' + key);
	var logValue;
	if (result == null) {
		logValue = "<null>";
	} else {
		logValue = result.substring(0, 50);
	}
	// console.log("get local storage: " + key + " / " + logValue);
	return result;
}

function localStorageGetDate(key) {
	var result = new Date(Date.parse(localStorageGet(key)));
	// console.log("get local storage date: " + key + " / " + result);
	return result;
}

function doTableBuild() {
	buildBaseHtml();

	var totalCampaigns = bk_results.campaigns.length;

	bk_results.campaigns.sort(function(a, b) {
		return a.campaign - b.campaign;
	});

	for (var i = 0; i < totalCampaigns; i++) {

		var campaign = bk_results.campaigns[i];

		var totalCategories = campaign.categories.length;

		campaign.categories.sort(function(a, b) {
			return a.categoryID - b.categoryID;
		});

		for (var j = 0; j < totalCategories; j++) {

			var row = $('<tr></tr>');
			row.attr('id', 'row' + i);

			if (j == 0) {

				row.addClass('thickTop');

				if (window.jsonparser.adminLoggedIn) {
					row.append('<td><a href="http://tags.bluekai.com/state_dump?campid=' + campaign.campaign
							+ '&camps=1">' + campaign.campaign + '</a></td>');
				} else {
					row.append('<td>' + campaign.campaign + '</td>');

				}

				if (campaign.BkDmpAudienceName) {
					row.append('<td>' + campaign.BkDmpAudienceName + '</td>');

				} else {
					row.append('<td/>');
				}

				row.append('<td>' + formatDate(campaign.timestamp) + '</td>');
			} else {
				row.append('<td/><td/><td/>');
			}

			var categoryCells = buildCategoryCells(campaign.campaign, campaign.categories[j], row);

			row.append(categoryCells);

			$('#rtTable tr:last').after(row);

		}

	}

	var retrieveBtns = $("[id^=inventory-retrieve]");

	for (var i = 0; i < retrieveBtns.length; i++) {

		retrieveBtns[i].addEventListener('click', function() {

			var catId = this.id.split("-")[3];

			retrieveInventory(catId);

		});
	}

	var viewBtns = $("[id^=inventory-view]");

	for (var i = 0; i < viewBtns.length; i++) {
		var btnId = viewBtns[i].id;

		var btnCatId = btnId.split("-")[3];

		var cacheData = localStorageGet('inventory-' + btnCatId);

		if (cacheData != null) {
			if ($('#' + btnId)[0].disabled) {
				processInventoryReturn(btnCatId, cacheData, "cacheUpdate");
			}

		}

	}

}

function buildBaseHtml() {

	var sourceJson = '<pre class="pre-scrollable"><code>' + syntaxHighlight(body) + '</code></pre>';

	var container = $('<div class="container-fluid"><h1>BlueKai JSON Return Tag Parser</h1></div>');
	$('body').prepend(container);

	container.append('<div>'
			+ modalTriggerHtml('source-json-modal', 'source-json-view', 'Source JSON', '', 'btn-md large') + '</div>');
	modalContentHtml('source-json-modal', 'Source JSON', sourceJson);

	var table = $('<table id="rtTable"></table>').addClass('table').addClass('table-striped');

	table.prepend($('<tbody></tbody>'));

	var headerRow = $('<tr class="thickTop"/>');

	headerRow.append($('<th>Campaign</th>'));
	headerRow.append($('<th>Bk Dmp Audience Name</th>'));
	headerRow.append($('<th>Timestamp (UTC)</th>'));
	headerRow.append($('<th>Category ID</th>'));
	headerRow.append($('<th>Category Timestamp</th>'));
	if (window.jsonparser.adminLoggedIn) {

		headerRow.append($('<th>Category</th>'));
		headerRow.append($('<th>Category Rules</th>'));
		headerRow.append($('<th>Inventory</th>'));
		headerRow.append($('<th>Inventory Timestamp</th>'));
	}
	table.append(headerRow);

	container.append(table);
	console.log('end buildBaseHtml()');

}

function buildCategoryCells(campaignId, category, row) {

	var catId = category.categoryID;

	var campCatId = campaignId + "-" + catId

	var urlStringPath = "http://tags.bluekai.com/state_dump?cat=" + catId + "&cats=1";
	var urlStringRules = "http://tags.bluekai.com/state_dump?mtype=FE&rules=1&rc=" + catId;

	var spanIdPath = campCatId + "-path";
	var spanIdRules = campCatId + "-rules";

	if (window.jsonparser.adminLoggedIn) {
		row.append('<td><a href="' + urlStringPath + '">' + category.categoryID + '</a></td>');
	} else {
		row.append('<td>' + category.categoryID + '</td>');
	}
	row.append('<td>' + formatDate(category.timestamp) + '</td>');

	if (window.jsonparser.adminLoggedIn) {
		row.append('<td><span id="' + spanIdPath + '">' + category.categoryID + '</span></td>');
		row.append('<td><span id="' + spanIdRules + '">Rules pending...</span></td>');

		var downloadImg = chrome.runtime.getURL('images/download.png');

		row.append('<td><button class="btn btn-info btn-sm medium" id="inventory-retrieve-'
				+ campCatId
				+ '">Retrieve</button>&nbsp;'
				+ modalTriggerHtml('inventory-modal-' + catId, 'inventory-view-' + campCatId, 'View', 'disabled',
						'btn-sm medium') + '</td>');
		modalContentHtml('inventory-modal-' + catId, 'Inventory Count', '');

		row.append('<td><span id="inventory-timestamp-' + campCatId + '"></span></td>');

		$.get(urlStringPath, processPathReturn(spanIdPath, 'inventory-modal-' + catId));

		$.get(urlStringRules, processRulesReturn(spanIdRules));

	}

}

function updateRetrieveBtns(catId, disabled, text, noMatchText) {
	var retrieveBtns = $("[id^=inventory-retrieve]");

	for (var i = 0; i < retrieveBtns.length; i++) {

		btn = retrieveBtns[i];
		btnId = retrieveBtns[i].id;
		$('#' + btnId).prop('disabled', disabled);

		if (btnId.indexOf("-" + catId) > -1) {

			$('#' + btnId)[0].innerHTML = text;

		} else {
			$('#' + btnId)[0].innerHTML = noMatchText;
		}
	}
}

function retrieveInventory(catId) {

	updateRetrieveBtns(catId, true, "loading...", "wait...");

	var urlStringInventory = "http://admin.bluekai.com/InventoryTrendReport?sellerSelect=*+All+*&tagSelect=*+All+*&taxonomyNode="
			+ catId
			+ "&frequency=1&inventoryType=normal&date=Radio1&timePeriod=5&interval=daily&columnNamesBox=Data+Provider&columnNamesBox=Site";

	// console.log("getting inventory: " + catId);

	$.get(urlStringInventory, processInventoryReturnCallback(catId));
}

function formatDate(t) {

	var d = new Date(t * 1000);

	return d.toISOString().replace("T", " ").replace(".000Z", "");
}

function modalTriggerHtml(showId, btnId, btnText, disabled, sizeClass) {
	var html = '<button type="button" id ="' + btnId + '" class="btn btn-success ' + sizeClass
			+ '" data-toggle="modal" data-target="#' + showId + '" ' + disabled + '>' + btnText + '</button>';

	return html;
}

function modalContentHtml(modalId, modalTitle, modalContent) {

	if ($("#" + modalId).length == 0) {

		// create modal if it doesn't already exist

		var modal = '';

		modal = modal + '<div id="' + modalId + '" class="modal fade" role="dialog">';
		modal = modal + '  <div class="modal-dialog">';
		modal = modal + '    <div class="modal-content">';
		modal = modal + '      <div class="modal-header">';
		modal = modal + '        <button type="button" class="close" data-dismiss="modal">&times;</button>';
		modal = modal + '        <h4 class="modal-title" id="' + modalId + '-title">' + modalTitle + '</h4>';
		modal = modal + '      </div>';
		modal = modal + '      <div class="modal-body" id="' + modalId + '-content">';
		modal = modal + modalContent;
		modal = modal + '      </div>';
		modal = modal + '      <div class="modal-footer">';
		modal = modal + '        <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>';
		modal = modal + '      </div>';
		modal = modal + '    </div>';
		modal = modal + '  </div>';
		modal = modal + '	</div>';

		m = $(modal);

		$('body').prepend(m);
	}
}

function syntaxHighlight(json) {
	json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
	return json.replace(
			/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
			function(match) {
				var cls = 'number';
				if (/^"/.test(match)) {
					if (/:$/.test(match)) {
						cls = 'key';
					} else {
						cls = 'string';
					}
				} else if (/true|false/.test(match)) {
					cls = 'boolean';
				} else if (/null/.test(match)) {
					cls = 'null';
				}
				return '<span class="' + cls + '">' + match + '</span>';
			});
}

function waitForAdminCheck() {

	console.log('admin check');

	if (!window.jsonparser.loginChecked) {
		setTimeout(waitForAdminCheck(), 300);
	} else {
		console.log('starting table build');
		doTableBuild();
	}

}

function start() {

	if (typeof bk_results !== "undefined") {

		$.get("http://tags.bluekai.com/state_dump", function(data) {

			document.body.innerHTML = '';

			if (data.includes("BlueKai Authentication")) {
				console.log('logged in false');
				window.jsonparser.adminLoggedIn = false;
			} else {
				console.log('logged in true');
				window.jsonparser.adminLoggedIn = true;
			}

			window.jsonparser.loginChecked = true;
			console.log('starting table build');
			doTableBuild();
		});

	} else {
		console.log("bk_results not found. Stopping.")
	}
}

window.jsonparser = window.bk_so_integration || {};

window.jsonparser.loginChecked = false;

window.jsonparser.adminLoggedIn = false;

window.jsonparser.timeoutId = -1;

var body = document.body.children[0].innerHTML;

eval(body);

start();