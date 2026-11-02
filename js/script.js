const botonViaje = document.getElementById("iniciarViaje");
const hero = document.getElementById("inicio");

botonViaje.addEventListener("click", () => {

    hero.classList.add("viaje-iniciado");

    botonViaje.disabled = true;

});
