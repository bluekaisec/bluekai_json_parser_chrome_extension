var processPathReturn = function(id) {
	return function(data, textStatus, jqXHR) {
		var s = data.split("</tr>");
		if (data.includes("BlueKai Authentication")) {
			taxonomyPath = "Not logged in...";
		} else {
			var taxonomyPath = s[1].split("<td>")[21].replace("</td>", "");

		}
		var span = $('#' + id);
		span[0].innerHTML = taxonomyPath;
		// $('#' + spanId).textContent(taxonomyPath);

	};
};

var processRulesReturn = function(id) {
	return function(data, textStatus, jqXHR) {

		//console.log(data)
		var rules = "";
		var s = data.split("</tr>");
		if (data.includes("BlueKai Authentication")) {
			rules = "Not logged in...";
		} else {
			rules = s[1].split("<td>")[4].replace("</td>", "");
			if (rules.includes("<b>Rule</b>")) {
				//this is hit when no rules are returned in the table. 
				rules = "";
			}

		}
		var span = $('#' + id);
		span[0].innerHTML = rules;
		// $('#' + spanId).textContent(taxonomyPath);

	};
};

function doTableBuild() {
	buildBaseHtml();

	var totalCampaigns = bk_results.campaigns.length;
	console.log("Total campaigns: " + totalCampaigns);

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

				row.append('<td><a href="http://tags.bluekai.com/state_dump?campid=' + campaign.campaign + '&camps=1">'
						+ campaign.campaign + '</a></td>');

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
}

function buildBaseHtml() {
	var container = $('<div class="container-fluid"><h1>Json Return Tag Parser</div>');

	var table = $('<table id="rtTable"></table>').addClass('table').addClass('table-striped');

	table.prepend($('<tbody></tbody>'));

	table
			.append($('<tr class="thickTop"><th>Campaign</th><th>Bk Dmp Audience Name</th><th>Timestamp (UTC)</th><th>Category ID</th><th>Category Timestamp</th><th>Category Path</th><th>Category Rules</th></tr>'));

	container.append(table);

	var sourceJson = '<pre class="pre-scrollable"><code>' + syntaxHighlight(body) + '</code></pre>';

	container.append(sourceJson);

	$('body').prepend(container);
}

function buildCategoryCells(campaignId, category, row) {

	var urlStringPath = "http://tags.bluekai.com/state_dump?cat=" + category.categoryID + "&cats=1";
	var urlStringRules = "http://tags.bluekai.com/state_dump?mtype=FE&rules=1&rc=" + category.categoryID;
	var spanIdPath = campaignId + "-" + category.categoryID + "-path";
	var spanIdRules = campaignId + "-" + category.categoryID + "-rules";

	row.append('<td><a href="' + urlStringPath + '">' + category.categoryID + '</a></td>');
	row.append('<td>' + formatDate(category.timestamp) + '</td>');
	row.append('<td><span id="' + spanIdPath + '">Path pending...</span></td>');
	row.append('<td><span id="' + spanIdRules + '">Rules pending...</span></td>');

	$.get(urlStringPath, processPathReturn(spanIdPath));

	$.get(urlStringRules, processRulesReturn(spanIdRules));

}

function formatDate(t) {

	var d = new Date(t * 1000);

	return d.toISOString().replace("T", " ").replace(".000Z", "");
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

var body = document.body.children[0].innerHTML;

eval(body);

if (typeof bk_results !== "undefined") {
	document.body.innerHTML = '';

	doTableBuild();
} else {
	console.log("bk_results not found. Stopping.")
}
