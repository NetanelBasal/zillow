var http = require("http"),
    cheerio = require("cheerio"),
    fs = require('fs'),
    j = require('jquery');

var json2csv = require('json2csv');
var humanize = require('humanize');

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
//[0]bergan, [1]essex, [2]union, [3]hudson
var places = ["http://www.zillow.com/homes/for_sale/Bergen-County-NJ/list/fsba,fsbo,new_lt/house,apartment_condo,duplex,townhouse_type/874_rid/150000-200000_price/571-761_mp/7_days/days_sort/41.133995,-73.893978,40.762114,-74.272483_rect/0_mmm/"];

var assets = [];


places.forEach(function(url, index) {

    download(url, function(data) {
        if (data) {

            var $ = cheerio.load(data);

            $('dt.property-address a.hdp-link').each(function(index) {

                //get the price
                var price = $(this).parent().parent().parent().parent().next().find('dt.price-large').text();

                //get the full link to asset page
                var fullLink = $(this).attr('href');

                //go to asset page
                download('http://www.zillow.com' + fullLink, function(data) {

                    var l = cheerio.load(data);

                    //get the address
                    var address = l('h1.prop-addr').text();
                    price = price.replace("$", "").replace(',', '');

                    //get zent astimate price
                    if (l('.zest-value').eq(1).length > 0) {
                        var zentAstimate = l('.zest-value').eq(1).text();
                        zentAstimate = parseInt(zentAstimate.replace("$", "").replace(',', ''));
                    } else {
                        var zentAstimate = null;
                    }

                    //get the link to tax table
                    var linkToTax = data.match(/asyncLoader.load\({"phaseType":"scroll","ajaxURL":"([^"]+)".*?home-tax-history/);

                    if (linkToTax != null) {
                        //there is tax table, get the json and crawel
                        download('http://www.zillow.com' + linkToTax[1], function(data) {
                            var d = JSON.parse(data);
                            var c = cheerio.load(d.html);
                            var tax = c('table tr.alt:first-child > td:nth-child(2)').text();
                            tax = tax.replace("$", "").replace(',', '');



                            //Ratio = ("Rent Zestimate" * 12 - "Property Taxes") / "For Sale" Price

                            var ratio = ((zentAstimate * 12) - parseInt(tax)) / (price);
                            // console.log(zentAstimate + ' tax:' + parseInt(tax) + ' price' + price);


                            assets.push({
                                "ratio": ratio.toFixed(2) + '%',
                                "price": humanize.numberFormat(price) + '$',
                                "address": address,
                                "link": 'http://www.zillow.com' + fullLink
                            });

                            json2csv({
                                data: assets,
                                fields: ['ratio', 'price', 'address', 'link']
                            }, function(err, csv) {
                                if (err) console.log(err);
                                fs.writeFile('zillow-test.csv', csv, function(err) {
                                    if (err) throw err;
                                });
                            });
                        })
                    } else {
                        //no tax table
                        assets.push({
                            "ratio": 'cant calc ratio',
                            "price": humanize.numberFormat(price) + '$',
                            "address": address,
                            "link": 'http://www.zillow.com' + fullLink
                        });

                        json2csv({
                            data: assets,
                            fields: ['ratio', 'price', 'address', 'link']
                        }, function(err, csv) {
                            if (err) console.log(err);
                            fs.writeFile('zillow-test.csv', csv, function(err) {
                                if (err) throw err;
                            });
                        });
                    }


                })
            })

        }
    });
})