

:- modeh(*,pere(+person,-person)).
:- modeh(*,mere(+person,-person)).

:- modeb(*,parent(+person,-person)).
:- modeb(*,sexe(+person,#genre)).

:- determination(pere/2,parent/2).
:- determination(pere/2,sexe/2).
:- determination(mere/2,parent/2).
:- determination(mere/2,sexe/2).


parent(marie, carolle).
parent(marie, frank).
parent(marc, carolle).
parent(marc, frank).
sexe(carolle, feminin).
sexe(frank, masculin).
parent(frank,dominique).
parent(frank,pascal).
sexe(dominique,feminin).
sexe(pascal,masculin).

