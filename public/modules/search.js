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
