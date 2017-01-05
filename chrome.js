chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
	//alert(JSON.stringify(changeInfo));
	if (changeInfo.url != null) {
		alert(changeInfo.url + " " + tabId);
	}
});