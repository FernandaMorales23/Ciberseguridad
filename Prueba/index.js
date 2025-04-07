/*alert("yaelo guapo")

localStorage.setItem('Darkmode', false)

//obtener el valor de las variables 
const valor = localStorage.getItem('Darkmode')
console.log("El valor de la variable es: " + valor)

//pa borrar la variable:, aunque tambien se pude desde el navegador
//localStorage.removeItem('Darkmode')

const NameKey = 'name'

sessionStorage.setItem(NameKey, 'Yaelo')

const valor1 = sessionStorage.getItem(NameKey)
console.log("El valor es : " + valor1)

//eliminar la sessionStorage:
sessionStorage.removeItem(NameKey)
*/
const person = {
    name: 'Yael',
    age: 18
}

const ssPersonKey = 'person'
sessionStorage.setItem(ssPersonKey, JSON.stringify(person))
const ssPerson = JSON.parse(sessionStorage.getItem(ssPersonKey))
console.log(ssPerson.name)
console.log(ssPerson.age)