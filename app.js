const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const _=require("lodash");
const { getDate } = require('./date');
const port = process.env.PORT || 3000;
const app = express();

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const url = process.env.MONGODB_URI || 'mongodb://localhost:27017/toDoListDB';


app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true });

const itemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  rating: { type: Number, min: 0, max: 10, default: 5 },
});

const Item = mongoose.model('Item', itemSchema);

const item1 = new Item({ name: 'Welcome to your to-do list!' });
const item2 = new Item({ name: 'Hit \'+\' to add a new item.' });
const item3 = new Item({ name: 'Hit \'-\' to delete the item' });

const defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemSchema],
});

const List = mongoose.model('List', listSchema);

app.get('/', function (req, res) {
  Item.find({})
    .then((items) => {
      if (items.length === 0) {
        Item.insertMany(defaultItems)
          .then(() => {
            console.log('Successfully saved items to DB.');
            return Item.find({});
          })
          .then((newItems) => {
            const day = getDate();
            res.render('list', { listTitle: day, task: newItems });
          })
          .catch((err) => {
            console.error(err);
            res.status(500).send('Internal Server Error');
          });
      } else {
        const day = getDate();
        res.render('list', { listTitle: day, task: items });
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Internal Server Error');
    });
});

app.post('/', function (req, res) {
    const itemName = req.body.task;
    const listName = req.body.list;
  
    const item = new Item({
      name: itemName,
    });

    if (listName === getDate()) {
        item.save()
        .then(() => {
            console.log('Successfully saved item to DB.');
            res.redirect('/');
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Internal Server Error');
        });
    }
    else {
        List.findOne({ name: listName })
        .then(existingList => { 
            existingList.items.push(item);
            return existingList.save();
        })
        .then(() => {
            res.redirect("/" + listName);
        })
        .catch(error => {
            console.error(error);
            res.status(500).send("Internal Server Error");
        });
    }
  });
  
app.post('/delete', function (req, res) {
  const itemId = req.body.checkbox;
  const listName=req.body.listName;

  if (listName === getDate()) {
    Item.findByIdAndDelete(itemId)
        .then((deletedItem) => {
            if (!deletedItem) {
                console.log('Item not found');
                res.status(404).send('Item not found');
            } else {
                console.log('Successfully deleted item');
                res.redirect('/');
            }
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Internal Server Error');
        });
  }

  else {
    List.findOneAndUpdate(
        { name: listName },
        { $pull: { items: { _id: itemId } } },
        { new: true } 
    )
        .then((existingList) => {
            if (existingList) {
                console.log('Successfully deleted item from custom list');
                res.redirect("/" + listName);
            } else {
                console.log('Custom list not found');
                res.status(404).send('Custom list not found');
            }
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Internal Server Error');
        });
  }
    
});

app.get('/:customListName', async function (req, res) {
    const customListName = _.capitalize(req.params.customListName);
    try {
        const existingList = await List.findOne({ name: customListName });
        if (!existingList) {
            const list = new List({
                name: customListName,
                items: defaultItems,
            });
            await list.save();
            res.redirect("/" + customListName);
        } 
        else 
        {
            res.render("list", { listTitle: existingList.name, task: existingList.items });
        }
    } 
    catch (error) 
    {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
});
  

app.get('/about', function (req, res) {
  res.render('about');
});

app.listen(port, function () {
  console.log(`Server started on port ${port}!`);
});


process.on('SIGINT', function () {
    mongoose.connection.close().then(() => {
      console.log('Mongoose default connection disconnected through app termination');
      process.exit(0);
    });
  });
  
