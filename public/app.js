var canvas;
const qs = e=>document.querySelector(e);
const qsa = e=>document.querySelectorAll(e);
const baseUrl = 'http://localhost:4001'

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
      <input type="radio" value="text" v-model="card.type"><label>Text</label>
      <input type="radio" value="image" v-model="card.type"><label>Image</label>
      <div v-if="card.type === 'image'">
        Front: <input type="file" accept="image/*" @change="uploadImage($event, true)"><br>
        Back: <input type="file" accept="image /*" @change="uploadImage($event, false)">
      </div>
      <div v-if="card.type === 'text'">
        Front: <input type="text" v-model="card.frontText" @blur="updateCard"><br>
        Back: <input type="text" v-model="card.backText" @blur="updateCard">
      </div>
    </div>
  `,
  props: {
    deckId: {type: Number, required: true},
    type: {type: String, default: 'image'},
    frontImage: {type: String, default: ''},
    backImage: {type: String, default: ''},
    frontText: {type: String, default: ''},
    backText: {type: String, default: ''},
    index: {type: Number, required: true}
  },
  data() {return {
    card: {
      type: this.type,
      frontImage: this.frontImage,
      backImage: this.backImage,
      frontText: this.frontText,
      backText: this.backText
    }
  }},
  methods: {
    updateCard() {
      this.$parent.cards[this.index] = this.card
    },
    uploadImage(e, isFront) { // TODO combine with app image methods
      var files = e.target.files || e.dataTransfer.files;
      if (!files.length) return;
      const file = files[0];
      var image = new Image();
      var reader = new FileReader();
      var vm = this.card;
      reader.onload = e => {
        if (isFront) {
          vm.frontImage = e.target.result;
        } else {
          vm.backImage = e.target.result;
        }
        this.updateCard();
      };
      reader.readAsDataURL(file);
    }
  }

});

Vue.component('deck-editor', {
  template: `
    <div class="deckEditor">
      <button @click="active = true" v-if="!active">Edit Deck: {{name || 'New Deck'}}</button>
      <div v-if="active">
        <label for="deckName">Deck name: </label><input type="text" id="deckName" v-model="name"><br>
        <label for="cardWidth">Card width: </label><input type="number" id="cardWidth" v-model="cardWidth">
        <label for="cardHeight">Card height: </label><input type="number" id="cardHeight" v-model="cardHeight"><br>
        <card-adder :deck-id="deckId" v-for="(card, index) in cards" v-bind="card" :key="index" :index="index"></card-adder>
        <button @click="newCard">New Card</button>
        <button @click="closeDeck">Done</button>
      </div>
    </div>
  `,
  props: {deckId: {type: Number, default: 0}},
  data() {return {
    cards: [],
    name: '',
    active: false,
    cardWidth: 200,
    cardHeight: 320
  }},
  methods: {
    closeDeck() {
      this.$root.decks[this.deckId] = {
        cards: this.cards,
        name: this.name
      };
      this.active = false;
    },
    newCard() {
      this.cards.push({ // TODO make a Card class for less copy/pasted code
        type: 'image',
        frontImage: '',
        backImage: '',
        frontText: '',
        backText: ''
      });
    }
  }
});

const app = new Vue({
  el: '#app',
  data: {
    players: [ // empty this for finished version
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
    decks: {
      '0': {name: '', cards: []}
    }, // objects of form {name: '', cards: []}
    curDeckId: 0
  },
  methods: {
    addPlayer() {
      this.players.push({name: 'Name Here', info: 'Info Here'})
    },
    createRoom() {
      // TODO: use backend script to make room id
      fetch(baseUrl+'/room')
      .then(res => res.json())
      .then(data => this.roomId = data.room)
    },
    createDeck() {
      Vue.set(this.decks, ++this.curDeckId, {name: '', cards: [], cardWidth: 200, cardHeight: 320});
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

function shuffle(arr) {
  var newArr = [];
  while(arr.length) {
    newArr.push(arr.splice(parseInt(Math.random()*arr.length), 1)[0]);
  }
  return newArr;
}
