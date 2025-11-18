const btn2 = document.getElementById("btn2");

function demoNative() {
    let out = "=== STEP 1: NATIVE TYPES ===\n";

    // String
    const s = "Hello World";
    out += "\n[String] s = " + s;
    out += "\nLength: " + s.length;
    out += "\nUpper: " + s.toUpperCase();

    // Number
    const n = 42;
    out += "\n\n[Number] n = " + n;

    // Boolean
    const b = true;
    out += "\n\n[Boolean] b = " + b;

    // Date
    const d = new Date();
    out += "\n\n[Date] now = " + d.toISOString();

    // Array
    const arr = [1, 2, 3, 4];
    out += "\n\n[Array] arr = [" + arr.join(", ") + "]";
    out += "\nPush 5 → " + (arr.push(5), arr.join(", "));
    out += "\nMap x2 → " + arr.map(x=>x*2).join(", ");

    // Functions as variables
    const add = function(a,b){ return a+b; };
    out += "\n\n[Function as variable] add(3,4) = " + add(3,4);

    // Callback
    function calc(a,b,fn){ return fn(a,b); }
    const result = calc(10,20,(x,y)=>x+y);
    out += "\n[Callback] calc(10,20, x+y ) = " + result;

    print(out);
}
document.addEventListener("DOMContentLoaded",()=>{
    pageLoaded();
});
function pageLoaded(){
    const num1 = document.getElementById("num1");
    const operation = document.getElementById("operation");
    const num2 = document.getElementById("num2");
    const answer = document.getElementById("answer");
    const calc = document.getElementById("calc")
    calc.addEventListener("click",calculate);
}



function calculate(){
    switch(operation.value){
        case "-":
            answer.innerHTML=Number(num1.value)  - Number(num2.value);
            break;
        case "*":
            answer.innerHTML= Number(num1.value)  * Number(num2.value);
            break;
        case "/":
            answer.innerHTML= Number(num1.value)  / Number(num2.value);
            break;
        default:
            answer.innerHTML= Number(num1.value)  + Number(num2.value);
            break;
    }
};



function print(msg) {
    const ta = document.getElementById("output");
    if (ta) ta.value = msg;
    else console.log(msg);
}