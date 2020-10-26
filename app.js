var canvas;
const qs = e=>document.querySelector(e);
const qsa = e=>document.querySelectorAll(e);

Vue.component('player-info', {
  template: `
    <table class="player">
    <tr><th contenteditable>{{name}}</th></tr>
    <tr><td contenteditable>{{info}}</td></tr>
    </table>
  `,
  props: ['name', 'info']
});

Vue.component('card-adder', {
  template: `
    <div class="cardAdder">
      Type:
      <input type="radio" value="text" v-model="type"><label>Text</label>
      <input type="radio" value="image" v-model="type"><label>Image</label>
      <div v-if="type === 'image'">
        Front: <input type="file"><br>
        Back: <input type="file">
      </div>
      <div v-if="type === 'text'">
        Front: <input type="text" v-model="frontText"><br>
        Back: <input type="text" v-model="backText">
      </div>
      <button @click="addCard">Add this card</button>
    </div>
  `,
  data() {return {
    type: 'image',
    frontImage: '',
    backImage: '',
    frontText: '',
    backText: ''
  }},
  methods: {
    addCard() {

    }
  }

});

const app = new Vue({
  el: '#app',
  data: {
    players: [
      {name: 'John', info: '$1500'},
      {name: 'Bob', info: '$1200, CT Ave'}
    ],
    roomId: '',
    board: {
      image: '',
      width: 1000, // TODO make this responsive based on screen size
      height: 700
    },
    pieces: [], // array of piece images
    decks: [], // objects of form {name: '', cards: []}
    numCardAdders: 1,
    creatingDeck: false
  },
  methods: {
    addPlayer() {
      this.players.push({name: 'Name Here', info: 'Info Here'})
    },
    createRoom() {
      // TODO: use backend script to make room id
      this.roomId = parseInt(Math.random()*36**6).toString(36);
    },
    handleUpload(e, type) {
      var files = e.target.files || e.dataTransfer.files;
      if (!files.length) return;
      this.createImage(files[0], type);
    },
    // from https://codepen.io/Atinux/pen/qOvawK/
    createImage(file, type) {
      var image = new Image();
      var reader = new FileReader();
      var vm = this;

      reader.onload = (e) => {
        switch (type) {
          case 'board':
            vm.board.image = e.target.result;
            fabric.Image.fromURL(vm.board.image, img => {
              img.set({left: 0, top: 0})
              img.scaleToHeight(canvas.height);
              canvas.add(img);
            });
            break;
          case 'piece':
            vm.pieces.push(e.target.result);
            fabric.Image.fromURL(e.target.result, img => {
              img.set({left: 0, top: 0})
              img.scaleToHeight(100);
              canvas.add(img);
            });
            break;
          default:
            console.error('type of image not recognized')
        }
      };
      reader.readAsDataURL(file);
    },
    removeImage(e) {
      this.image = '';
    },
  },
  mounted() {
    canvas = new fabric.Canvas('mainCanvas');
  }
});
