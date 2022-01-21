

:- modeh(*,grandpere(+person,-person)).
:- modeh(*,grandmere(+person,-person)).

:- modeb(*,mere(+person,-person)).
:- modeb(*,pere(+person,-person)).
:- modeb(*,parent(+person,-person)).
:- modeb(*,sexe(+person,#genre)).

:- determination(grandpere/2,parent/2).
:- determination(grandpere/2,pere/2).
:- determination(grandpere/2,mere/2).
:- determination(grandpere/2,sexe/2).
:- determination(grandmere/2,parent/2).
:- determination(grandmere/2,pere/2).
:- determination(grandmere/2,mere/2).
:- determination(grandmere/2,sexe/2).

mere(A,B) :- parent(A,B), sexe(B,feminin).
pere(A,B) :- parent(A,B), sexe(B,masculin).

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
parent(carolle,lola).
parent(carolle,louis).
sexe(lola,feminin).
sexe(louis,masculin).
