import { HeroBanner } from "@/components/sections/HeroBanner";
import { FeaturedCourses } from "@/components/sections/FeaturedCourses";
import { Reviews } from "@/components/sections/Reviews";
import { Features } from "@/components/sections/Features";
import { Instructor } from "@/components/sections/Instructor";
import { FAQ } from "@/components/sections/FAQ";

export default function Home() {
  return (
    <>
      <HeroBanner />
      <FeaturedCourses />
      <Features />
      <Reviews />
      <Instructor />
      <FAQ />
    </>
  );
}
