const express=require("express");
const app=express();
const body_parser=require("body-parser");
app.set("view-engine","ejs");
app.use(body_parser.urlencoded({extended: true}));
app.use(express.static("public"));
const mongoose=require("mongoose");

mongoose.connect("mongodb://localhost:27017/quizdb");
const question_schema=new mongoose.Schema({ 
    question:{
        type: String,
        trim: true
    },
    options:{
        type: [String]
    },
    answer:{
        type: Number,
        trim: true
    }
});
const Question=mongoose.model("Question",question_schema);


const quiz_schema=new mongoose.Schema({
    name:{
        type: String,
        trim: true
    },
    questions:[{
        type: [mongoose.Schema.Types.ObjectId],
        ref: Question
    }],
    Max_Marks:{
        type: Number
    }
});
const Quiz=mongoose.model("Quiz",quiz_schema);

const teacher_schema=new mongoose.Schema({
    Username:{
        type: String,
        unique: true,
        trim: true,
        lowercase: true
    },
    Name:{
        type: String,
        trim: true
    },
    College:{
        type: String,
        trim: true
    },
    Email_id:{
        type: String,
        trim: true
    },
    Phone_No:{
        type: Number,
        trim: true
    },
    Quiz_created:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: Quiz
    }],
    Password:{
        type: String,
        trim: true,
    }
});
const Teacher_user=mongoose.model("Teacher",teacher_schema);

const student_schema=new mongoose.Schema({
    Username:{
        type: String,
        unique: true,
        trim: true,
        lowercase: true,
    },
    Name:{
        type: String,
        trim: true,
    },
    Roll_No:{
        type: String,
        trim: true
    },
    college:{
        type: String,
    },
    Email_id:{
        type: String,
        trim: true,
    },
    Phone_No:{
        type: Number,
        trim: true,
    },
    Quiz_attempted:[{
        Quiz_ID:{
            type:mongoose.Schema.Types.ObjectId,
            ref: Quiz
        },
        Answer:[{
            type:Number
        }],
        Mark_Obtained:{
            type: Number
        }
    }],
    Password:{
        type: String,
        trim: true,
    }
});
const Student_user=mongoose.model("Student",student_schema);

var student_detail={
    Username:"",
    Name:"",
    Roll_No:"",
    college:"",
    Email_id:"",
    Phone_No:00,
    Password:""
};
var Quiz_Attempted=[];
var Quiz_Available=[];
var teacher="";

var invalid_credintals="login";
var disclaimer="";
var invalid_creation="";

var quiz_no=-1;
var ques_no=1;
var all_ques=[];
var all_option=[];
var all_answer=[];
var total_ques;
var quiz_started=false;
var attempts={};
var attempt_one=true;

function home_page(req,res){
    disclaimer="";
    invalid_credintals="login";
    ques_no=1;
    invalid_creation="";
    attempt_one=true;
    Quiz_Attempted=[];
    Quiz_Available=[];
    res.sendFile(__dirname+"/home.html");
}

function removeByAttr(arr, attr, value){
    var i = arr.length;
    while(i--){
        let p=String(arr[i][attr]);
        let q=String(value);
        if( p === q){ 
            arr.splice(i,1);
        }
    }
    return arr;
}

async function student_register_async (req,res) {
    res.render("student_register.ejs",{
        credintals: invalid_creation,
        Name:student_detail.Name,
        Roll_No:student_detail.Roll_No,
        Username:student_detail.Username,
        College:student_detail.college,
        Email_Id:student_detail.Email_id,
        Phone_No:student_detail.Phone_No,
        Password:student_detail.Password
    })
}

function student_register(req,res) {
    if(invalid_credintals===""){
        student_detail={
            Username:"",
            Name:"",
            Roll_No:"",
            college:"",
            Email_id:"",
            Phone_No: 0,
            Password:""
        };
        student_register_async(req,res);
    }
    else{
        student_register_async(req,res);
    }
}

async function student_register_response(req,res){
    student_detail={};
    student_detail.Username=req.body.username;
    student_detail.Name=req.body.name;
    student_detail.Roll_No=req.body.roll;
    student_detail.college=req.body.college;
    student_detail.Email_id=req.body.email;
    student_detail.Phone_No=req.body.phone;
    student_detail.Password=req.body.password;
    const stud=new Student_user({
        Username:student_detail.Username,
        Name:student_detail.Name,
        Roll_No:student_detail.Roll_No,
        college:student_detail.college,
        Email_id:student_detail.Email_id,
        Phone_No:student_detail.Phone_No,
        Password:student_detail.Password
    })
    stud.save(function(err){
        if(err){
            console.log(err);
            invalid_creation="Username is not unique!";
            res.redirect("/student_register");
        }
        else{
            student_detail={
                Username:"",
                Name:"",
                Roll_No:"",
                college:"",
                Email_id:"",
                Phone_No:00,
                Password:""
            };
            invalid_creation="Student Added Successfully!"
            res.redirect("/student_register");
        }
    })
}

function student_login_page(req,res) {
    invalid_credintals="login";
    disclaimer="";
    invalid_creation="";
    if(attempt_one===true)
    {
        res.render("student_login.ejs", {credintals: ""});
    }
    else
        res.render("student_login.ejs", {credintals: invalid_credintals});
}

function student_login_page_response(req,res){
    Quiz_Attempted=[];
    Quiz_Available=[];
    var student=req.body.username;
    student=student.toLowerCase();
    mongoose.connect("mongodb://localhost:27017/quizdb");
    Student_user.find({"Username":student},function(err,result){
        if(err){
            console.log(err);
        }
        else{
            if(result.length>0 && result[0].Password===req.body.password){
                student_detail=result[0];
                Quiz.find({},function(err,result){
                    if(err){
                        console.log(err);
                    }
                    else{
                        Quiz_Available=result;
                        
                        for(var i=0; i<student_detail.Quiz_attempted.length; i=i+1)
                        {
                            removeByAttr(Quiz_Available,"_id",student_detail.Quiz_attempted[i].Quiz_ID);
                            var attempt=student_detail.Quiz_attempted[i];
                            Quiz.find({"_id":attempt.Quiz_ID},function (err,result) {
                                if(err){
                                    console.log(err);
                                }
                                else{
                                    var obj={};
                                    result=result[0];
                                    obj.Quiz_Name=result.name;
                                    obj.Ques_List=result.questions;
                                    obj.Mark_Obtained=attempt.Mark_Obtained;
                                    obj.Max_Marks=result.Max_Marks;
                                    obj.Attempted_Answer=attempt.Answer;
                                    Quiz_Attempted.push(obj);
                                }
                            })
                        };
                    }
                });          
                invalid_credintals="";
                res.redirect("/student_profile");
            }
            else{
                attempt_one=false;
                res.redirect("/student");
            }
        }
    });
}

function student_profile_display(req,res){
    if(invalid_credintals==="login"){
        res.redirect("/badway");
    }
    else{
        res.render("student_profile.ejs",{
            Name: student_detail.Name,
            Username: student_detail.Username,
            Email_id: student_detail.Email_id,
            Phone_No: student_detail.Phone_No,
            College: student_detail.college,
            Roll_No: student_detail.Roll_No,
            Quiz_Attempted: Quiz_Attempted,
        })
    }
}

function student_profile_response(req,res) {
    all_ques=[];
    all_option=[];
    all_answer=[];
    quiz_no=Number(req.body.Quiz_No);
    quiz_no=quiz_no-1;
    ques_no=1;
    total_ques=Quiz_Attempted[quiz_no].Ques_List.length;
    for(let i=0; i<total_ques; i=i+1){
        Question.find({_id: Quiz_Attempted[quiz_no].Ques_List[i]},function(err,result){
            if(err){
                console.log(err);
            }
            else{
                result=result[0];
                all_ques.push(result.question);
                all_option.push(result.options);
                all_answer.push(result.answer);
            }
        })
    }
    res.redirect("/quiz_display");
}

async function display_quiz(req,res){
    if(invalid_credintals==="login"){
        res.redirect("/badway");
    }
    else{
        var ques=all_ques[ques_no-1];
        var options=all_option[ques_no-1];
        if(ques_no<=total_ques && ques_no>0)
        {
            res.render("quiz_display.ejs",{
                Ques_no: ques_no,
                Total_ques: total_ques,
                Ques: ques,
                Options: options,
                Attempt: Quiz_Attempted[quiz_no].Attempted_Answer[ques_no-1],
                Answer: all_answer[ques_no-1]+1
            });
        }
    }
}

function display_quiz_response(req,res){
    if(req.body.action==="Previous"){
        ques_no-=1;
        res.redirect("/quiz_display");
    }
    else{
        ques_no+=1;
        res.redirect("/quiz_display");
    }
}

function response_fill(req)
{
    var p=Number(req.body.option);
    if(p>0 && p<5)
        attempts[ques_no]=p;
}

function available_quizes(req,res){
    if(invalid_credintals==="login"){
        res.redirect("/badway");
    }
    else{
        res.render("quiz_available.ejs",{
            Quiz_Available: Quiz_Available
        })
    }
}

function available_quizes_response(req,res) {
    all_ques=[];
    all_option=[];
    all_answer=[];
    quiz_no=Number(req.body.Quiz_No);
    quiz_no=quiz_no-1;
    total_ques=Quiz_Available[quiz_no].questions.length;
    ques_no=1;
    for(let i=0; i<total_ques; i=i+1){
        Question.find({_id: Quiz_Available[quiz_no].questions[i]},function(err,result){
            if(err){
                console.log(err);
            }
            else{
                result=result[0];
                all_ques.push(result.question);
                all_option.push(result.options);
                all_answer.push(result.answer);
            }
        })
    }
    res.redirect("/instruction");
}

function question_display(req,res){
    if(invalid_credintals==="login"){
        res.redirect("/badway");
    }
    else
    {
        if(quiz_started===false)
        {
            for(var i=1; i<=total_ques; i++)
            {
                attempts[i]=0;
            }
            quiz_started=true;
        }
        var ques=all_ques[ques_no-1];
        var options=all_option[ques_no-1];
        if(ques_no<=total_ques && ques_no>0)
        {
            res.render("quiz.ejs",{
                Ques_no: ques_no,
                Total_ques: total_ques,
                Ques: ques,
                Options: options,
                Attempt: attempts[ques_no]
            });
        }
    }
}

function question_response(req,res){
    response_fill(req);
    if(req.body.action==="Previous"){
        ques_no-=1;
        res.redirect("/quiz");
    }
    else if(req.body.action==="Next"){
        ques_no+=1;
        res.redirect("/quiz");
    }
    else{
        res.redirect("/result");
    }
}

function false_attempt(req,res){
    res.sendFile(__dirname+"/wrong.html");
}

function teacher_login_page(req,res){
    res.render("teacher_login.ejs", {credintals: invalid_credintals});  
}

function teacher_login_page_response(req,res){
    teacher=req.body.username;
    teacher=teacher.toLowerCase();
    var user_id=teachers.indexOf(teacher);
    if(user_id===-1 || teach_pass[user_id]!=req.body.password){
        invalid_credintals="login";
        res.redirect("/teacher");
    }
    else{
        res.redirect("/teacher/home");
    }  
}

function result_display(req,res){
    var marks=0;
    let att=[];
    for(var i=0 ;i<total_ques; i++)
    {
        if(attempts[i+1]===all_answer[i]+1)
        {
            marks+=3;
        }
        att.push(attempts[i+1]);
    }
    Student_user.updateOne({"Username":student_detail.Username},{
        $push:{
            Quiz_attempted:{
                Quiz_ID: Quiz_Available[quiz_no]._id,
                Answer: att,
                Mark_Obtained: marks
            }
        }
    },function (err) {
        if(err){
            console.log(err);
        }
    });
    let result=marks+" marks secured out of "+total_ques*3;
    res.render("result.ejs",{
        result: result,
        Name: student_detail.Name,
        Username: student_detail.Username,
        Email: student_detail.Email_id,
        Phone: student_detail.Phone_No,
        College: student_detail.college,
        Roll: student_detail.Roll_No
    });
    invalid_credintals="login";
    attempt_one=true;

}

function instruction(req,res) {
    res.render("instruction.ejs",{
        disclaimer:disclaimer
    });
}

function instruction_response(req,res) {
    if(req.body.Option==="done"){
        res.redirect("/quiz");
    }
    else{

        disclaimer="Please tick the checkbox to proceed";
        res.redirect("/instruction");
    }
}

function logout(req,res) {
    res.redirect("/");
}


app.get("/",home_page);
app.get("/student",student_login_page);
app.post("/student",student_login_page_response);
app.get("/student_register",student_register);
app.post("/student_register",student_register_response);
app.get("/student_profile",student_profile_display);
app.post("/student_profile",student_profile_response);
app.get("/quiz_display",display_quiz);
app.post("/quiz_display",display_quiz_response);
app.get("/available_quiz",available_quizes);
app.post("/available_quiz",available_quizes_response);
//app.get("/contact_admin",admin_contact);
app.get("/logout",logout);
app.get("/quiz",question_display);
app.post("/quiz",question_response);
app.get("/teacher",teacher_login_page);
app.post("/teacher",teacher_login_page_response);
app.get("/result",result_display);
app.get("/badway",false_attempt);
app.get("/instruction",instruction);
app.post("/instruction",instruction_response);

app.listen(3123,function(){
    console.log("Quiz server started at 3123");
})