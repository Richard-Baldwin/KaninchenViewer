"""Extract the full product (component) path + world bounding box of every solid in a STEP file.

occt-import-js flattens sub-assemblies, so build-data.mjs uses this to recover component names
by matching body bounding boxes.
"""
import json
import sys

from OCP.Bnd import Bnd_Box
from OCP.BRepBndLib import BRepBndLib
from OCP.STEPCAFControl import STEPCAFControl_Reader
from OCP.TCollection import TCollection_ExtendedString
from OCP.TDataStd import TDataStd_Name
from OCP.OCP.collections import Sequence_TDF_Label as TDF_LabelSequence
from OCP.TDF import TDF_Label
from OCP.TDocStd import TDocStd_Document
from OCP.TopAbs import TopAbs_SOLID
from OCP.TopExp import TopExp_Explorer
from OCP.TopLoc import TopLoc_Location
from OCP.XCAFDoc import XCAFDoc_DocumentTool

src = sys.argv[1] if len(sys.argv) > 1 else "../rabbitbot published.step"

doc = TDocStd_Document(TCollection_ExtendedString("XmlOcaf"))
reader = STEPCAFControl_Reader()
reader.SetNameMode(True)
reader.ReadFile(src)
reader.Transfer(doc)
st = XCAFDoc_DocumentTool.ShapeTool_s(doc.Main())


def name(label):
    attr = TDataStd_Name()
    if label.FindAttribute(TDataStd_Name.GetID_s(), attr):
        return attr.Get().ToExtString()
    return ""


out = []
occ = [0]


def walk(label, loc, path):
    if st.IsReference_s(label):
        ref = TDF_Label()
        st.GetReferredShape_s(label, ref)
        walk(ref, loc * st.GetLocation_s(label), path)
        return
    here = path + [name(label)]
    if st.IsAssembly_s(label):
        comps = TDF_LabelSequence()
        st.GetComponents_s(label, comps)
        for i in range(1, comps.Length() + 1):
            walk(comps.Value(i), loc, here)
        return
    shape = st.GetShape_s(label).Moved(loc)
    occ[0] += 1
    exp = TopExp_Explorer(shape, TopAbs_SOLID)
    while exp.More():
        box = Bnd_Box()
        BRepBndLib.AddOptimal_s(exp.Current(), box, False, False)
        lo, hi = box.CornerMin(), box.CornerMax()
        x0, y0, z0, x1, y1, z1 = lo.X(), lo.Y(), lo.Z(), hi.X(), hi.Y(), hi.Z()
        out.append({"path": here, "o": occ[0], "c": [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2], "s": [x1 - x0, y1 - y0, z1 - z0]})
        exp.Next()


roots = TDF_LabelSequence()
st.GetFreeShapes(roots)
for i in range(1, roots.Length() + 1):
    walk(roots.Value(i), TopLoc_Location(), [])

with open("names.json", "w", encoding="utf-8") as f:
    json.dump(out, f)
print("solids", len(out))
