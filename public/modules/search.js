/**
 * Created by AJH on 2016-12-15.
 */
onmessage = function(event) {
    var Data = event.data;
    if(Data=="search")
    {
        setInterval(search, 10000); //10분
        postMessage("OK!")
    }
}
function search() {
    console.log("searching!")
    list_m.find({}).sort('index').exec(function (err, docs_m) {
        //남자오름차순 여자오름차순 한다음에...
        console.log("a!")
        list_w.find({}).sort('index').exec(function (err, docs_w) {
            //남자오름차순 여자오름차순 한다음에...
            console.log("b")
            try {
                console.log("c")
                console.log(docs_m[0] + docs_w[0]);
                if (docs_m[0] != null && docs_w[0] != null)
                    test(docs_m[0].user_id, docs_w[0].user_id);
            } catch (e) {
                console.log(e)
            }

        })

    })


}
