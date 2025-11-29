const btn2 = document.getElementById("btn2");
let num1, num2, operation, answer, calcBtn;

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
    out += "\nPush 5 -> " + (arr.push(5), arr.join(", "));
    out += "\nMap x2 -> " + arr.map(x => x * 2).join(", ");

    // Functions as variables
    const add = function (a, b) { return a + b; };
    out += "\n\n[Function as variable] add(3,4) = " + add(3, 4);

    // Callback
    function calc(a, b, fn) { return fn(a, b); }
    const result = calc(10, 20, (x, y) => x + y);
    out += "\n[Callback] calc(10,20, x+y ) = " + result;

    // overwrite output when showing demo
    print(out, false);
}

document.addEventListener("DOMContentLoaded", () => {
    pageLoaded();
});

function pageLoaded() {
    num1 = document.getElementById("num1");
    operation = document.getElementById("operation");
    num2 = document.getElementById("num2");
    answer = document.getElementById("answer");
    calcBtn = document.getElementById("calc");
    num1.addEventListener("input", validateNumber);
    num2.addEventListener("input", validateNumber);
    calcBtn.addEventListener("click", calculate);
}

function validateNumber(e) {
    const input = e.target;
    const value = input.value;

    if (value.trim() === "" || isNaN(value)) {
        input.classList.remove("is-valid");
        input.classList.add("is-invalid");
    } else {
        input.classList.remove("is-invalid");
        input.classList.add("is-valid");
    }
}

function calculate() {
    const aStr = num1.value.trim();
    const bStr = num2.value.trim();

    const aInvalid = aStr === "" || isNaN(aStr);
    const bInvalid = bStr === "" || isNaN(bStr);
    if (aInvalid) {
        num1.classList.add("is-invalid");
        num1.classList.remove("is-valid");
    } else {
        num1.classList.add("is-valid");
        num1.classList.remove("is-invalid");
    }

    if (bInvalid) {
        num2.classList.add("is-invalid");
        num2.classList.remove("is-valid");
    } else {
        num2.classList.add("is-valid");
        num2.classList.remove("is-invalid");
    }
    if (aInvalid || bInvalid) {
        print("Invalid input. Please enter numeric values.", true);
        return;
    }
    const a = Number(aStr);
    const b = Number(bStr);
    const op = operation.value;
    let res;
    switch (op) {
        case "-":
            res = a - b;
            break;
        case "*":
            res = a * b;
            break;
        case "/":
            res = a / b;
            break;
        default:
            res = a + b;
            break;
    }
    answer.innerHTML = res;
    const logLine = `Calc: ${a} ${op} ${b} = ${res}`;
    print(logLine, true);
}

function print(msg, append) {
    const ta = document.getElementById("output");
    if (!ta) {
        if (append) {
            console.log(msg);
        } else {
            console.clear();
            console.log(msg);
        }
        return;
    }
    if (append) {
        if (ta.value.length > 0) {
            ta.value += "\n" + msg;
        } else {
            ta.value = msg;
        }
    } else {
        ta.value = msg;
    }
}