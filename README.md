# Gufron Language (.gfr)

Esolang interpreter buatan sendiri. Syntax terinspirasi dari bahasa Sunda/Jawa dengan indentation-based blocks (kayak Python).

## Instalasi

### Pakai binary (tanpa Node.js)
Download binary dari [Releases](../../releases) sesuai OS:

```bash
# Linux
./gfr-linux file.gfr

# macOS
./gfr-macos file.gfr

# Windows
gfr-win.exe file.gfr
```

### Pakai Node.js
```bash
git clone <repo>
cd gufron-lang
node index.js run file.gfr
```

## Penggunaan

```bash
# Jalankan langsung
gfr run file.gfr

# Compile ke JavaScript
gfr build file.gfr
# output: file.js
```

## Syntax Reference

| Gufron | JavaScript | Keterangan |
|--------|-----------|------------|
| `asqoli x ina val` | `const x = val` / `let x = val` | auto-detect const/let |
| `x ina val` | `x = val` | reassignment |
| `maqoli x` | `console.log(x)` | output |
| `syalala` | `true` | boolean true |
| `syududu` | `false` | boolean false |
| `motor_gufron` | `null` | null |
| `ina` | `=` | assignment |
| `inna` | `==` | equal |
| `innna` | `===` | strict equal |
| `la ina` | `!=` | not equal |
| `besar` | `>` | greater than |
| `kecil` | `<` | less than |
| `besar_inna` | `>=` | greater or equal |
| `kecil_inna` | `<=` | less or equal |
| `la` | `!` | logical not |
| `+` `-` `*` `/` | `+` `-` `*` `/` | aritmatika |
| `fi, cond:` | `if (cond) {` | if |
| `fima, cond:` | `} else if (cond) {` | else if |
| `ma:` | `} else {` | else |
| `jancok fn a, b:` | `function fn(a, b) {` | function declaration |
| `balikkeun val` | `return val` | return |
| `fn arg1, arg2` | `fn(arg1, arg2)` | function call |
| `liyer, cond:` | `while (cond) {` | while loop |
| `liyer, i ina 0, i kecil n, i ina i + 1:` | `for (let i=0; i<n; i++) {` | for loop |
| `coba:` | `try {` | try |
| `goblok err:` | `} catch (err) {` | catch |

---

### Variabel
Pakai `asqoli`. Auto-detect `const` atau `let` — kalau di-reassign jadi `let`, kalau tidak jadi `const`.

```gfr
asqoli nama ina "Gufron"
asqoli umur ina 25

umur ina 26
```

### Tipe Data

| Gufron | Nilai |
|--------|-------|
| `syalala` | `true` |
| `syududu` | `false` |
| `motor_gufron` | `null` |

```gfr
asqoli aktif ina syalala
asqoli kosong ina motor_gufron
```

### Operator

| Gufron | JavaScript |
|--------|-----------|
| `ina` | `=` |
| `inna` | `==` |
| `innna` | `===` |
| `la ina` | `!=` |
| `besar` | `>` |
| `kecil` | `<` |
| `besar_inna` | `>=` |
| `kecil_inna` | `<=` |
| `la` | `!` |
| `+` `-` `*` `/` | sama |

### Output
```gfr
maqoli "Hello, World!"
maqoli nama
```

### If / Else If / Else
```gfr
fi, umur besar 17:
	maqoli "dewasa"
fima, umur inna 17:
	maqoli "baru dewasa"
ma:
	maqoli "belum dewasa"
```

### Function
```gfr
jancok tambah a, b:
	balikkeun a + b

asqoli hasil ina tambah 3, 4
maqoli hasil

maqoli tambah 10, 5
tambah 1, 2
```

Pemanggilan function tanpa kurung, argumen dipisah koma.

### Loop

**While:**
```gfr
asqoli n ina 5
liyer, n besar 0:
	maqoli n
	n ina n - 1
```

**For:**
```gfr
liyer, i ina 0, i kecil 5, i ina i + 1:
	maqoli i
```

### Try / Catch
```gfr
coba:
	asqoli x ina variabelTidakAda
goblok err:
	maqoli "error:"
	maqoli err
```

`err` opsional — bisa `goblok:` tanpa nama variabel.

---

## Contoh Program Lengkap

```gfr
jancok faktorial n:
	fi, n kecil_inna 1:
		balikkeun 1
	balikkeun n * faktorial n - 1

asqoli hasil ina faktorial 5
maqoli hasil

liyer, i ina 1, i kecil_inna 10, i ina i + 1:
	fi, i inna 5:
		maqoli "lima!"
	ma:
		maqoli i

coba:
	asqoli x ina tidakAda
goblok e:
	maqoli e
```

---

## Struktur Project

```
gufron-lang/
  index.js                    → entry point
  package.json
  src/
    lexer.js                  → tokenizer
    parser.js                 → recursive descent parser → AST
    environment.js            → Environment (scoping) + ReturnSignal
    interpreter.js            → tree-walking interpreter
  .github/workflows/build.yml → CI/CD auto build binary
```

## Build Binary

```bash
npm install
npm run build
# output: dist/gfr-linux, dist/gfr-macos, dist/gfr-win.exe
```

Push ke `main` → GitHub Actions otomatis build dan upload ke GitHub Releases.
