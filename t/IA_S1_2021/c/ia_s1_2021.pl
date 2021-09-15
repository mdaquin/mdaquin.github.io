school_mail(X) :- from(X,Y), teacher(Y).
school_mail(X) :- from(X,Y), admin(Y).
about(X,Z)   :- from(X,Y), teacher(Y), teaches(Y,Z).
about(X, courseTime) :- about(X, time), about(X, Y), course(Y).
highlight(X) :- from(X,Y), family(me,Y), marked(X, urgent).
highlight(X) :- about(X,courseTime), marked(X, urgent).
teacher(X) :- teaches(X,Y).
course(Y)  :- teaches(X,Y).
admin(X) :- workAt(X, idmc), not(teacher(X)).
spam(X) :- from(X,Y), not(teacher(Y)), not(admin(Y)), not(family(me, Y)).

teaches(mdaquin, ai).
teaches(gbonnin, ai).

marked(m1,urgent).
from(m1, mdaquin).
about(m1, time).

workAt(karine, idmc).
family(me, karine).
from(m2, karine).

from(m3, bob).
family(alice, bob).