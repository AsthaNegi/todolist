//jshint esversion:6

require('dotenv').config;

const express = require("express");
const bodyParser = require("body-parser");
const mongoose =require("mongoose");
const _=require("lodash");


 
const app = express();

const PORT = process.env.PORT || 3000;
mongoose.set("strictQuery",false);

// importing connectDB function from local module 
const connectDB = require('./config/db');
// connectDB();


app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));



// defining items schema
const itemsSchema ={
   
  name:{
    type:String,
    required:[1,"Name of item missing"]
  }

};

// Defining Item model 

const Item = mongoose.model("Item",itemsSchema);



// defining multiple documents 
const item1=new Item({
  name:"Read"
});

const item2 = new Item({
  name: "Write"
});

const item3 = new Item({
  name : "Jog"
});


// storing them in an array
const defaultItems =[item1,item2,item3];


 // list schema 
 const listSchema = {
  name:String,
  items:[itemsSchema]
 };

// list model 
const List = mongoose.model("List",listSchema);



app.get("/", function(req, res) {
  
  // Getting hold of data present in todolist DB
// getting the documents present in the items collection
  Item.find({})
      .then((foundItems)=>{
        
        if(foundItems.length === 0){
            // inserting multiple documents at once inside a collection

            Item.insertMany(defaultItems)
                .then(()=>{console.log("Items inserted")})
                .catch((err)=>{console.log(err)});
            
            // res.redirect("/");     
        }
        
        ///------------check rendering data module -------------
        res.render("list", {listTitle:"Today", newListItems: foundItems});
      
      })
      .catch((err)=>{console.log(err)});


});

app.post("/", function(req, res){

  // tking the name entered by user with the help of body parser
  const itemName  = req.body.newItem;
  const listName = req.body.list;

  // making a document out of name
  const item =new Item({
    name:itemName
  });

  
  // the new item is from root route 
  if(listName === "Today"){

    // insert that document in items collection
  item.save();

  // rendering new added item on the screen
  res.redirect("/");

  }
  else {
   // the new item is from custom route 
   

   // find the list documnet of that name
   List.findOne({name:listName})
        .then((foundList)=>{
           
          // adding new item in that list document
          foundList.items.push(item);
          // save that document 
          foundList.save();  

          // rendering custom list page 
          res.redirect("/"+listName);

        })
        .catch((err)=>{console.log(err)});

  }

  
});


app.post("/delete",function(req,res){

  // grasping the _id of the checked box since checked box will return it's value which is ._id
  const checkedItemId = req.body.checkbox;

  // list title 
  const listName = req.body.listName;
   

  if(listName === "Today"){
   // the list is from root route 
    
      
      // deleting document with this _id from items collection
      Item.findByIdAndRemove(checkedItemId)
      .then(()=>{
        console.log("Deleted checked item")
        res.redirect("/"); // redirecting to home route in order for changes to reflect on the screen which needs to be rendered again
      })
      .catch((err)=>{console.log(err)});

  }
  else{
    // the list is from custom route 
    
    // finding that list document 
    // $pull deletes the item from the items field with mentioned _id
    List.findOneAndUpdate({name:listName},{$pull:{items: {_id: checkedItemId}}})
       .then((foundList)=>{
        
        // redirecting after deleting 
         res.redirect("/"+listName);

       })
       .catch((err)=>{console.log(err)})

  }



});


// express Route Parameters 

app.get("/:listName",function(req,res){

     let customListName = _.capitalize(req.params.listName);


     List.findOne({name:customListName})
          .then((foundList)=>{
            
            if(!foundList){
              // create a new list cos customListName list doesn't exist
              const list = new List({
                 name: customListName,
                 items :defaultItems
              }); 

              list.save();

              // rendering the page after creating 
              res.redirect("/"+customListName);
               
            }
            else{
              // show an existing list cos customListName exists 
               
              res.render("list",{listTitle:foundList.name,newListItems:foundList.items});
             }
            })   
          .catch((err)=>{console.log(err)});


});


// app.get("/work", function(req,res){
//   res.render("list", {listTitle: "Work List", newListItems: workItems});
// });

// app.get("/about", function(req, res){
//   res.render("about");
// });



connectDB().then( ()=> {
  app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
  })

});


// app.listen(3000, function() {
//   console.log("Server started on port 3000");
// });

