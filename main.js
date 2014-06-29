var http = require("http"),
    cheerio = require("cheerio"),
    fs = require('fs'),
    j = require('jquery');

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
var url = "http://www.zillow.com/homes/for_sale/Bergen-County-NJ/list/fsba,fsbo,new_lt/house,apartment_condo,duplex,townhouse_type/874_rid/150000-200000_price/574-765_mp/1_days/days_sort/41.29896,-73.611145,40.526848,-74.64798_rect/9_zm/1_p/0_mmm/";


download(url, function(data) {
    if (data) {

        var $ = cheerio.load(data);
        $('dt.property-address a.hdp-link').each(function(index) {
            var price = $(this).parent().parent().parent().parent().next().find('dt.price-large').text();
            var fullLink = $(this).attr('href');
            download('http://www.zillow.com' + fullLink, function(data) {
                var l = cheerio.load(data);

                var data =
                    'address:' + l('h1.prop-addr').text() +
                    ' ,price:' + price +
                    ' ,zentAstimate:' + l('.zest-value').eq(1).text() + ' ';

                fs.appendFile('data.txt', data)
            })
        })

    }
});