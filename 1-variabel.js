/**
 * Variabel : wadah yang menampung sebuah nilai
 *
 * Syntax Pattern :
 * declare_name variable_name = value;
 */

// 1. Declare Name -> Mendeklarasikan sebuah variabel
/**
 * -. var -> global variable, tidak terikat block scope
 * -. let -> terikat block scope, fleksible untuk define value (bukan redeclare)
 * -. const -> terikat block scope, tidak fleksible (tidak bisa redefine value apalagi redeclare variabel)
 */

/**
 * Note :
 * Block Scope : Cakupan Block {}
 *
 * Contoh :
 * function panggilNama(){
 *
 * }
 *
 * if(){
 *
 * }
 *
 * while(){
 *
 * }
 */

// Contoh :
var umur = 10;
{
  var umur = 20;
  console.log(umur);
}
console.log(umur);

let alamat = "Jl Untung";
{
  let alamat = "Jl Gak Untung";
  alamat = "Jl Yauda";
  console.log(alamat);
}
console.log(alamat);

const jabatan = "manager";
const kode_pos = 123;
{
  const jabatan = "sales";
  console.log(kode_pos);
}
console.log(jabatan);

// 2. Variabel Name -> camelCaseVariable : sedangMakan, sudahTidur
let isLogin = false;
let authToken = "eyakjdlakdl129i3i";

// 3. Value Variabel -> Data Type
/**
 * Data Types :
 * 1. Primitive Data Types:
 * -. string : kalimat, teks atau character
 * -. number : angka (bulat (int)/desimal (float))
 * -. boolean : logika (true/false)
 * -. null : kosong
 * -. undefined : nilai belum di definisi
 * -. ...
 *
 * 2. Object/Reference Data Types:
 * -. object
 * -. array
 * -. function
 * -. class
 * -. ...
 */

// 1. Primitive Data Types
// -. String (Teks)
let token = "ey13123haskjdnakjdnbak";
// -. Number (Angka)
let session = 30_000;
// -. Boolean (Logika)
let isAdminAuthorization = true;
// -. Null (kosong)
let score = null;
// -. Undefined (Nilai belum ada)
let saldo = undefined;

console.log("============");
let angka1 = 10;
let angka2 = 10;
console.log(angka1 === angka2);

let obj1 = {};
let obj2 = {};
console.log(obj1 === obj2);
