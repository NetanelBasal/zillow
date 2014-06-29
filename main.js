var http = require("http"),
    cheerio = require("cheerio");

function download(url, callback) {
    http.get(url, function(res) {
        var data = "";
        res.on('data', function(chunk) {
            data += chunk;
        });
        res.on("end", function() {
            callback(data);
        });
    }).on("error", function() {
        callback(null);
    });

}
var assets = [];
var url = "http://www.zillow.com/homes/for_sale/Bergen-County-NJ/874_rid/150000-200000_price/573-764_mp/days_sort/41.373202,-73.23967,40.48926,-75.023575_rect/9_zm/"


download(url, function(data) {

    if (data) {
        var $ = cheerio.load(data);
        var numPages = $('ul.pagination-2012').find('li.next').prev().text();
        for (var i = 2; i <= numPages; i++) {
            var urlPaginate = url + [i] + '_p';
            download(urlPaginate, function(data) {
                var $ = cheerio.load(data);
                $('dl.property-info-list > dt.type > strong').each(function(index) {
                    if ($(this).text() == 'House For Sale') {
                        var fullLink = $(this).parent().parent().next().first().find('a').attr('href');
                        download('http://www.zillow.com' + fullLink, function(data) {

                            // console.log(l('h1.prop-addr').text() + ' : ' + l('h2.forSale').children().last().text());
                            var l = cheerio.load(data);
                            assets.push({
                                address: l('h1.prop-addr').text(),
                                zentAstimate: l('.zest-value').eq(1).text()
                            });
                            console.log(assets);
                        });
                    }
                })

            })
        };


    } else console.log("error");
});