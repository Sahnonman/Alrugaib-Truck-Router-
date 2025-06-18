import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

// Default restriction times per zone
const DEFAULT_RESTRICTIONS = {
  makkah: { start: "00:00", end: "23:59" },          // منع كامل اليوم
  medina: { start: "00:00", end: "23:59" },          // منع كامل اليوم
  riyadhCenter: { start: "06:00", end: "21:00" },    // حظر 6ص–9م
  easternProvince: { start: "00:00", end: "00:00" }, // إعداد يدوي
  jeddah: { start: "09:00", end: "19:00" },          // مثال مبدئي
};

export default function InputForm({ onSubmit: handleCalculateRoute }) {
  const [formData, setFormData] = useState({
    originAddress: "",
    destinationAddress: "",
    vehicleType: "",
    axleCount: 2,
    dimensions: { length: "", width: "", height: "" },
    grossWeight: "",
    maxLoad: "27",
    fuelEfficiency: "",
    fuelPrice: "",
    fixedCostKm: "",
    fixedCostHour: "",
    stops: [{ location: "", duration: "" }],
    departure: "",
    avoidFerries: false,
    avoidTunnels: false,
    avoidRoughRoads: false,
    avoidSharpTurns: false,
    prohibitedZones: {
      makkah: false,
      medina: false,
      riyadhCenter: false,
      easternProvince: false,
      jeddah: false,
    },
    restrictionTimes: { ...DEFAULT_RESTRICTIONS },
    mandatoryRestHours: "",
  });

  const handleChange = (key, value) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  const handleDimensionChange = (dim, value) =>
    setFormData((prev) => ({
      ...prev,
      dimensions: { ...prev.dimensions, [dim]: value },
    }));

  const handleStopsChange = (index, field, value) => {
    const newStops = [...formData.stops];
    newStops[index][field] = value;
    setFormData((prev) => ({ ...prev, stops: newStops }));
  };

  const addStop = () =>
    setFormData((prev) => ({
      ...prev,
      stops: [...prev.stops, { location: "", duration: "" }],
    }));

  const removeStop = (index) =>
    setFormData((prev) => ({
      ...prev,
      stops: prev.stops.filter((_, i) => i !== index),
    }));

  const handleProhibitedZoneChange = (zone, checked) =>
    setFormData((prev) => ({
      ...prev,
      prohibitedZones: { ...prev.prohibitedZones, [zone]: checked },
    }));

  const handleRestrictionTimeChange = (zone, field, value) =>
    setFormData((prev) => ({
      ...prev,
      restrictionTimes: {
        ...prev.restrictionTimes,
        [zone]: { ...prev.restrictionTimes[zone], [field]: value },
      },
    }));

  const onSubmit = (e) => {
    e.preventDefault();
    handleCalculateRoute(formData);
  };

  return (
    <Card className="p-4 max-w-lg mx-auto">
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          {/* Origin Address */}
          <div>
            <Label>عنوان الانطلاق</Label>
            <Input
              type="text"
              placeholder="مثال: الرياض، حي الملك فهد"
              value={formData.originAddress}
              onChange={(e) => handleChange("originAddress", e.target.value)}
            />
          </div>

          {/* Destination Address */}
          <div>
            <Label>عنوان الوجهة</Label>
            <Input
              type="text"
              placeholder="مثال: جدة، المنطقة الصناعية"
              value={formData.destinationAddress}
              onChange={(e) =>
                handleChange("destinationAddress", e.target.value)
              }
            />
          </div>

          {/* Vehicle Type */}
          <div>
            <Label>نوع المركبة</Label>
            <Select
              value={formData.vehicleType}
              onValueChange={(v) => handleChange("vehicleType", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر نوع المركبة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5-axle-trailer">نصف مقطورة 5 محاور</SelectItem>
                <SelectItem value="trailer">تريلا</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Axle Count */}
          <div>
            <Label>عدد المحاور</Label>
            <Input
              type="number"
              value={formData.axleCount}
              onChange={(e) => handleChange("axleCount", e.target.value)}
            />
          </div>

          {/* Dynamic Trailer Constraints */}
          {formData.vehicleType === "trailer" && (
            <div className="p-4 border rounded-lg space-y-4">
              <Label>قيود دخول التريلات</Label>
              {Object.keys(formData.prohibitedZones).map((zone) => (
                <div key={zone} className="space-y-1">
                  <Checkbox
                    checked={formData.prohibitedZones[zone]}
                    onChange={(e) =>
                      handleProhibitedZoneChange(zone, e.target.checked)
                    }
                  >
                    {getZoneLabel(zone)} (افتراضي:{" "}
                    {formData.restrictionTimes[zone].start} -{" "}
                    {formData.restrictionTimes[zone].end})
                  </Checkbox>
                  {formData.prohibitedZones[zone] && (
                    <div className="grid grid-cols-2 gap-2 ml-6">
                      <div>
                        <Label>بداية الحظر (HH:mm)</Label>
                        <Input
                          type="time"
                          value={formData.restrictionTimes[zone].start}
                          onChange={(e) =>
                            handleRestrictionTimeChange(zone, "start", e.target.value)
                          }
                        />
                      </div>
                      <div>
                        <Label>نهاية الحظر (HH:mm)</Label>
                        <Input
                          type="time"
                          value={formData.restrictionTimes[zone].end}
                          onChange={(e) =>
                            handleRestrictionTimeChange(zone, "end", e.target.value)
                          }
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}

              <div>
                <Label>ساعات الراحة الإلزامية للسائق (ساعات)</Label>
                <Input
                  type="number"
                  value={formData.mandatoryRestHours}
                  onChange={(e) =>
                    handleChange("mandatoryRestHours", e.target.value)
                  }
                />
              </div>
            </div>
          )}

          {/* Remaining sections: Dimensions, Weight, Fuel, Stops, Departure, Preferences */}
          {/* … */}

          <Button type="submit" className="w-full">
            احسب المسار
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function getZoneLabel(zone) {
  const labels = {
    makkah: "مكة المكرمة",
    medina: "المدينة المنورة",
    riyadhCenter: "مركز الرياض",
    easternProvince: "المنطقة الشرقية",
    jeddah: "جدة",
  };
  return labels[zone] || zone;
}
