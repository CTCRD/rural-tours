function renderHomePage(){
  var app = $('#app').html( html`
    <div id="nav">
      <!-- <div id="go-to-add-poi">+</div> -->
      <div style="display: flex; justify-content: center; align-items: center; margin-left: 50px;">
        <img style="width: 50px; height: 50px; object-fit: cover;" src="/img/rural_icon.png"></img>
        <span style="font-size: 1.8em; margin-left: 20px;">Rural Tours</span>
      </div>
    </div>
    <div id="divide-home">
      <div id="side-bar"></div>
      <div id="map"></div>
    </div>
    <div id="poi-detail-modal-bkg" class="hide-me">
      <div id="poi-detail-modal-content" style="width">
        <h4> Introducir link</h4>
      </div>
    </div>
  `)
  app.find('#go-to-add-poi').click(()=>{
    Router.go('add-poi')
  })
   
  var drIslandCenter = { lat: 18.860430, lng: -70.169053 },
      map = new google.maps.Map(app.find('#map')[0], {
        zoom: 9,
        minZoom: 9,
        center: drIslandCenter,
        styles: [{"featureType":"administrative","elementType":"labels.text.fill","stylers":[{"color":"#444444"}]},{"featureType":"administrative.country","elementType":"geometry","stylers":[{"visibility":"off"},{"hue":"#ffb800"}]},{"featureType":"administrative.country","elementType":"geometry.fill","stylers":[{"visibility":"on"}]},{"featureType":"administrative.province","elementType":"labels.icon","stylers":[{"hue":"#ff0000"},{"visibility":"on"}]},{"featureType":"landscape","elementType":"all","stylers":[{"color":"#f2f2f2"}]},{"featureType":"poi","elementType":"all","stylers":[{"visibility":"off"}]},{"featureType":"road","elementType":"all","stylers":[{"saturation":-100},{"lightness":45}]},{"featureType":"road.highway","elementType":"all","stylers":[{"visibility":"simplified"}]},{"featureType":"road.arterial","elementType":"labels.icon","stylers":[{"visibility":"off"}]},{"featureType":"transit","elementType":"all","stylers":[{"visibility":"off"}]},{"featureType":"water","elementType":"all","stylers":[{"color":"#46bcec"},{"visibility":"on"}]}],
        disableDefaultUI: true
      }),
      strictBounds = new google.maps.LatLngBounds(
        { lat: 17.696531, lng: -72.984063 },/* SW */
        { lat: 20.068997, lng: -68.007257 } /* NE */
      ),
      strictSW = {
        lat: strictBounds.getSouthWest().lat(), 
        lng: strictBounds.getSouthWest().lng()
      },
      strictNE = {
        lat: strictBounds.getNorthEast().lat(), 
        lng: strictBounds.getNorthEast().lng()
      },
      prevSW = strictSW,
      prevNE = strictNE,
      timeout = 0,
      markers,
      pois
  
  function adjustBounds(){
    var bounds = map.getBounds(),
        newSW = {
          lat: bounds.getSouthWest().lat(), 
          lng: bounds.getSouthWest().lng()
        },
        newNE = {
          lat: bounds.getNorthEast().lat(), 
          lng: bounds.getNorthEast().lng()
        },
        adjust = false

    if(newSW.lat < strictSW.lat) (newSW.lat = strictSW.lat) && (adjust = true)
    if(newSW.lng < strictSW.lng) (newSW.lng = strictSW.lng) && (adjust = true)
    if(newNE.lat > strictNE.lat) (newNE.lat = strictNE.lat) && (adjust = true)
    if(newNE.lng > strictNE.lng) (newNE.lng = strictNE.lng) && (adjust = true)

    if( adjust ){
      let prevZoom = map.getZoom()
      map.fitBounds(new google.maps.LatLngBounds(newSW, newNE))
      map.setZoom(prevZoom)
    }
  }

  google.maps.event.addListener(map, 'bounds_changed', function () {
    clearTimeout(timeout)
    timeout = setTimeout(adjustBounds, 10)
  });
  
  axios.get('http://api.ruraltours.online/api/pois').then((response) =>{
    console.log("response", response.data)
    pois = response.data.reverse()
    pois.forEach(poi =>{
      let marker = new google.maps.Marker({
        position: poi.location,
        map: map,
        icon: '/img/rural_icon.png'
      })
      marker.addListener('click', ()=>{swal("Has seleccionado: " + poi.name)})
      markers.push(marker)
      $('#side-bar').append(poiSide(poi))
    })
  }).catch(()=>{
    swal("Error de red, intentar luego", "", "error")
  });

  let key = {}
  function keypress(event){
    event && (key[event.keyCode] = (event && event.type) == 'keydown')
    var center = {
          lat: map.getCenter().lat(), 
          lng: map.getCenter().lng()
        },
        movement =( 22-map.getZoom())/1000,
        UP = 87,
        DOWN = 83,
        LEFT = 65,
        RIGHT = 68,
        ZOOM_IN = 73,
        ZOOM_OUT = 79
      
    if(key[UP]) center.lat += movement
    if(key[DOWN]) center.lat -= movement
    if(key[LEFT]) center.lng -= movement
    if(key[RIGHT]) center.lng += movement
    if(key[UP] || key[DOWN] || key[LEFT] || key[RIGHT]) map.setCenter(center)
    
    if(key[ZOOM_IN] && map.getZoom() < 14) map.setZoom(map.getZoom() + 1)
    if(key[ZOOM_OUT]) map.setZoom(map.getZoom() - 1)
    
    // console.log(event.keyCode)
    if(event && event.type == 'keydown')
      google.maps.event.addListener(map, 'idle', ()=>{
        keypress()
        google.maps.event.clearListeners(map, 'idle')
      })
  }

  document.addEventListener('keydown', keypress);
  document.addEventListener('keyup', keypress);

  function poiSide(poi){
    return html`
      <div class="poi-side">
        <img src='${poi.photos[0]}'/>
        <span>${poi.name}</span>
        <!-- <span>${poi.description}</span> -->
      </div>
    `
  }
}