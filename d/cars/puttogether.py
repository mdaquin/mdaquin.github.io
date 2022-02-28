import sys


for i in range(1, len(sys.argv)):
    fn = sys.argv[i]
    brand = fn[:-4]
    with open(fn) as f:
        header = f.readline()
        if i==1:
            print("brand,"+header.strip())
        l=f.readline()
        while l:
            print(brand+","+l.strip())
            l=f.readline()
