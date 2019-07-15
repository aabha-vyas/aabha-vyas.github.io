
function buttonClick(words){
  document.getElementById("demo").innerHTML = "Here are the performers: "+ words;
}

function changeImage(){
  var image = document.getElementById("theImage")
  if (image_tracker == "smash"){
    image.scr="smash.jpg";
    image_tracker="smash";
  }
}
