create table student(
       firstname varchar(50),
       lastname varchar(50),
       house varchar(1),
       primary key (firstname, lastname));
create table house(ID varchar(1),
       	     	   name varchar(50),
		   creator varchar(50));

insert into house (ID, name, creator) values ("G", "Griffondor", "Godric Gryffondor");
insert into house (ID, name, creator) values ("R", "Ravenclaw", "Rowena Ravenclaw");
insert into house (ID, name, creator) values ("H", "Hufflepuff", "Helga Hufflepuff");
insert into house (ID, name, creator) values ("S", "Slytherin", "Salazar Slytherin");

insert into student (firstname, lastname, house) values ("Harry", "Potter", "G");
insert into student (firstname, lastname, house) values ("Hermione", "Granger", "G");
insert into student (firstname, lastname, house) values ("Ron", "Weasley", "G");
insert into student (firstname, lastname, house) values ("Draco", "Malfoy", "S");
insert into student (firstname, lastname, house) values ("Luna", "Lovegood", "R");
insert into student (firstname, lastname, house) values ("Vicent", "Crabbe", "S");
insert into student (firstname, lastname, house) values ("Gregory", "Goyle", "S");
insert into student (firstname, lastname, house) values ("Parvati", "Patil", "R");
