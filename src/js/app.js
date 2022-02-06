
const bootstrap = require('bootstrap');
var $ = require("jquery");
const popperjs = require('popper.js');
const zxcvbn = require('zxcvbn');


const inputFile = document.getElementById("customFile"); 
inputFile.addEventListener("change", updateNameAndSize, false); 


const genBtn = document.getElementById("generateButton");
genBtn.addEventListener("click", generateKey, false); 

let password = document.getElementById('inputPassword');
password.addEventListener("input", keyCheckMeter, false);

const encryptBtn = document.getElementById("encryptBtn");
encryptBtn.addEventListener("click", encryptFile); 

const decryptBtn = document.getElementById("decryptBtn");
decryptBtn.addEventListener("click", decryptFile); 

const resetBtn = document.getElementById("resetBtn");
resetBtn.addEventListener("click", resetInputs); 


const DEC = {
  signature: "RW5jcnlwdGVkIFVzaW5nIEhhdC5zaA", 
  hash: "SHA-512",
  algoName1: "PBKDF2",
  algoName2: "AES-GCM",
  algoLength: 256,
  itr: 80000,
  salt: window.crypto.getRandomValues(new Uint8Array(16)),
  perms1: ["deriveKey"],
  perms2: ['encrypt', 'decrypt'],
}


$(function () {
  $('[data-toggle="tooltip"]').tooltip()
})


function errorMsg(msg) {
  let errTag =
    `<div class="alert alert-danger alert-error" role="alert">
    <button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>
    <strong>Error!</strong> ${msg}
  </div>`;
  document.getElementById("error").insertAdjacentHTML('beforeEnd', errTag); 
  window.setTimeout(function () {
    $(".alert-error").fadeTo(500, 0).slideUp(500, function () {
      $(this).remove();
    });
  }, 4000);
}



function updateNameAndSize() {
  showResetBtn();
  let nBytes = 0,
    oFiles = inputFile.files,
    nFiles = oFiles.length,
    placeHolder = document.getElementById("file-placeholder");

  for (let nFileId = 0; nFileId < nFiles; nFileId++) {
    nBytes += oFiles[nFileId].size;
    fileName = oFiles[nFileId].name;
  }
  let sOutput = nBytes + " bytes";
 
  for (let aMultiples = ["KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"], nMultiple = 0, nApprox = nBytes / 1024; nApprox > 1; nApprox /= 1024, nMultiple++) {
    sOutput = nApprox.toFixed(2) + " " + aMultiples[nMultiple];
  }

  if (!inputFile.value) {
    placeHolder.innerHTML = "Choose a file to encrypt/decrypt";
  } else {
    placeHolder.innerHTML = fileName + '  <span class="text-success">' + sOutput + '</span>';
  }


}
 
function showResetBtn(){$("#resetBtn").css("display", "");}
function hideResetBtn(){$("#resetBtn").css("display", "none");}

function resetInputs(){
  if (inputFile.value != 0 || password.value != 0) {
    inputFile.value = "";
    password.value = "";
    updateNameAndSize();
    hideResetBtn();
    keyCheckMeter();
  } 
}


function keyCheckMeter() {
  let strength = {
    0: "Very Bad",
    1: "Bad",
    2: "Weak",
    3: "Good",
    4: "Strong"
  };
  let password = document.getElementById('inputPassword');
  let meter = document.getElementById('strength-meter');
  let text = document.getElementById('strength-text');
  let val = password.value;
  let result = zxcvbn(val);
  meter.style.width = result.score * 25 + '%';
  if (val !== "") {
    text.innerHTML = strength[result.score];
    showResetBtn();
  } else {
    text.innerHTML = "none.";
  }
}

function str2ab(str) {
  const buf = new ArrayBuffer(str.length);
  const bufView = new Uint8Array(buf);
  for (let i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}

function processFinished(name, data, method, dKey) {

  let msg;
  let status;
  let keyBtn;
  const randomId = Math.floor((Math.random() * 100) + 1);
  if (method == 1) {
    msg = "Сәтті шифрланды";
    status = "encrypted";
    keyBtn = `<button type="button" class="btn btn-outline-secondary btn-sm" data-toggle="modal" data-target=".modal${randomId}"><i class="fas fa-key"></i>
    Дешифрлау кілті</button>`;
  } else {
    msg = "Сәтті дешифрланды";
    status = "decrypted"
    keyBtn = '';
  }

  const blob = new Blob(data, {
    type: 'application/octet-stream'
  }); 
  const url = URL.createObjectURL(blob);
  const htmlTag = `<div class="result">
  <div class="modal fade bd-example-modal-sm modal${randomId}" tabindex="-1" role="dialog" aria-labelledby="mySmallModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-sm">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="exampleModalLabel">дешифрлау кілті</h5>
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                  <span aria-hidden="true">&times;</span>
                </button>
              </div>
            <div class="modal-body">${dKey}</div>
        </div>
      </div>
    </div>

  <div class="alert alert-outline ${status}" role="alert">
    <i class="fas fa-check"></i> ${name.replace('Encrypted-', '')} was <strong>${msg}</strong>
    <hr>
    <div class="btn-group">
      <a class="btn btn-outline-secondary btn-sm" href="${url}" download="${name}" role="button"><i class="fas fa-download"></i> ${status}
          file </a> ${keyBtn}
    </div>
  </div><!-- end alert -->
</div><!-- end result -->`;
  document.getElementById("results").insertAdjacentHTML('afterbegin', htmlTag); 

}

function generateKey() { 
  const usedChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&_-+=~';
  let keyArray = new Uint8Array(20); 
  window.crypto.getRandomValues(keyArray); 
  keyArray = keyArray.map(x => usedChars.charCodeAt(x % usedChars.length));
  const randomizedKey = String.fromCharCode.apply(null, keyArray);
  password.value = randomizedKey; 
  keyCheckMeter(); 
}

function importSecretKey() { 
  let rawPassword = str2ab(password.value); 
  return window.crypto.subtle.importKey(
    "raw", 
    rawPassword, 
    {
      name: DEC.algoName1
    }, 
    false, 
    DEC.perms1 
  );

}


async function deriveEncryptionSecretKey() { 
  let getSecretKey = await importSecretKey();

  return window.crypto.subtle.deriveKey({
      name: DEC.algoName1,
      salt: DEC.salt,
      iterations: DEC.itr,
      hash: {
        name: DEC.hash
      },
    },
    getSecretKey, 
    { 
      name: DEC.algoName2,
      length: DEC.algoLength,
    },
    false, 
    DEC.perms2 
  )

}

async function encryptFile() {
  if (!inputFile.value || !password.value) {
    errorMsg("Please browse a file and enter a Key")
  } else {
    
    const derivedKey = await deriveEncryptionSecretKey(); 
    const file = inputFile.files[0]; 
    const fr = new FileReader();

    const n = new Promise((resolve, reject) => {

      fr.onloadstart = async () => {
        $(".loader").css("display", "block");
      };

      fr.onload = async () => {

        const iv = window.crypto.getRandomValues(new Uint8Array(16)); 
        const content = new Uint8Array(fr.result); 
       
        await window.crypto.subtle.encrypt({
            iv,
            name: DEC.algoName2
          }, derivedKey, content) 
          .then(function (encrypted) {
            
            resolve(processFinished('Encrypted-' + file.name, [window.atob(DEC.signature), iv, DEC.salt, new Uint8Array(encrypted)], 1, password.value)); //create the new file buy adding signature and iv and content
            resetInputs(); 
          })
          .catch(function (err) {
            errorMsg("An error occured while Encrypting the file, try again!"); 
          });
        $(".loader").css("display", "none"); 
      }
      
      fr.readAsArrayBuffer(file)

    });
  }
}




async function decryptFile() {

  if (!inputFile.value || !password.value) {
    errorMsg("Please browse a file and enter a Key")
  } else {

    const file = inputFile.files[0]; 
    const fr = new FileReader(); 

    const d = new Promise((resolve, reject) => {

      fr.onloadstart = async () => {
        $(".loader").css("display", "block"); //show spinner while loading a file
      };

      fr.onload = async () => {
        
        async function deriveDecryptionSecretKey() { 

          let getSecretKey = await importSecretKey();

          return window.crypto.subtle.deriveKey({
              name: DEC.algoName1,
              salt: new Uint8Array(fr.result.slice(38, 54)),
              iterations: DEC.itr,
              hash: {
                name: DEC.hash
              },
            },
            getSecretKey,
            { 
              name: DEC.algoName2,
              length: DEC.algoLength,
            },
            false, 
            DEC.perms2 
          )
         
        
        }

        const derivedKey = await deriveDecryptionSecretKey(); 

        const iv = new Uint8Array(fr.result.slice(22, 38)); 

        const content = new Uint8Array(fr.result.slice(54)); 

        await window.crypto.subtle.decrypt({
            iv,
            name: DEC.algoName2
          }, derivedKey, content)
          .then(function (decrypted) {
            

            resolve(processFinished(file.name.replace('Encrypted-', ''), [new Uint8Array(decrypted)], 2, password.value)); 
            
            resetInputs(); 
          })
          .catch(function () {
            errorMsg("You have entered a wrong Decryption Key!");
          });

        $(".loader").css("display", "none"); 
      }

      fr.readAsArrayBuffer(file) 

    });
  }

}
