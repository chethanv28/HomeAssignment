const fileType = ".jar";
const repoType = "Maven";
const username = 'admin';
const pwd = 'DW6qjcvgtP';
var maven_repos = []

var request_maven_repos = require('request'),
    maven_repos_url = "http://35.232.203.67/artifactory/api/repositories?&packageType="+repoType;

request_maven_repos (
	{
		url : maven_repos_url,
		headers : {
			"Authorization" : "username"+":"+pwd
		}
	},
	function (error, response, body) {
		// Unknown error
		if (error) { 
			return console.log(error); 
		}
		if (!error && response.statusCode == 200) {
			var data = JSON.parse(body);
		}
		
		for (var i in data) {
			var repo_name = data[i].key + "-cache";
			maven_repos.push(repo_name);
		}
		
		// Build the string containing all the repos separated by comma
		var repos = maven_repos[0];
		for (i in maven_repos) {
			if (i != 0) {				
				repos += "," + maven_repos[i];
			}
		}
		
		var request = require('request'),
			url = "http://35.232.203.67/artifactory/api/search/artifact?name="+fileType+"&repos=" + repos;
		
		
		request(
			{
				url : url,
				headers : {
					"Authorization" : "username"+":"+pwd
				}
			},
			function (error, response, body) {
				
				// Unknown error
				if (error) { 
					return console.log(error); 
				}
				
				if (!error && response.statusCode == 200) {
					var resp = JSON.parse(body);
				}
				var urls = [];
				var responses = [];
				var completed_requests = 0;
				for (i in resp.results) {
					//Build the stats url for all jar file type artifacts
					var stats_url = resp.results[i].uri + "?stats";
					urls.push(stats_url);
				}
				const request = require('request-promise');
				const promises = urls.map(url => request(url));
				// Wait for all promises to be ready
				Promise.all(promises)
				.then((data) => {
					mostPopular = [];
					nextMostPopular = [];
					biggest = -Infinity,
					next_biggest = -Infinity;
					var repo_dCount = {};
					
					// Find the highest and 2nd highest number of downloads
					for (var i = 0, n = data.length; i < n; ++i) {
						var repoStat = JSON.parse(data[i]);
						var nr = repoStat.downloadCount;
						if (nr in repo_dCount) {
							repo_dCount[nr].push(repoStat.uri);
						} else {
							repo_dCount[nr] = [];
							repo_dCount[nr].push(repoStat.uri);
						}
						if (nr > biggest) {
							next_biggest = biggest;
							biggest = nr;

						} else if (nr < biggest && nr > next_biggest) {
							next_biggest = nr;
						}
					}
					
					var biggestFound = false;
					var next_biggestFound = false;
					for (var repo in repo_dCount) {
						if (parseInt(repo) === biggest) {
							biggestFound = true;
							console.log("Most popular jar file(s) in a maven repositories with "+ biggest +" downloads :");
							for (var i in repo_dCount[repo]) {
								console.log(repo_dCount[repo][i]);
							}
							console.log("");
						}
						if (parseInt(repo) === next_biggest) {
							next_biggestFound = true;
							console.log("2nd most popular jar file(s) in maven repositories with "+ next_biggest +" downloads :");
							for (var i in repo_dCount[repo]) {
								console.log(repo_dCount[repo][i]);
							}
							console.log("");
						}									
					}
					
					if (next_biggestFound === false) {
						console.log("There is no 2nd most popular jar file(s) in maven repositories");
					}
					if (biggestFound === false) {
						console.log("No downloads found for jar file(s) in maven repositories");
					}
				})
				.catch(function(err) {
					console.log("Error while calling one of the stats API")
					throw err;
				});
			}
		);
	}
);
