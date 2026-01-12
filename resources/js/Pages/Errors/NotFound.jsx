import React from "react";
import { Head, Link } from "@inertiajs/react";

const NotFound = () => {
    return (
        <>
            <Head title="Page Not Found - 404" />
            <div
                className="page_404 pt-[10vh] sm:pt-[50px] "
                style={{
                    background: "#fff",
                    fontFamily: '"Arvo", serif',
                    overflow: "hidden",
                }}
            >
                <div className="container mx-auto px-4">
                    <div className="flex justify-center">
                        <div className="text-center">
                            <div
                                className="four_zero_four_bg  "
                                style={{
                                    backgroundImage: "url(/images/bg.gif)",
                                    height: "50vh",
                                    marginBottom: "60px",
                                    backgroundPosition: "center",
                                    backgroundRepeat: "no-repeat",
                                    backgroundSize: "contain",
                                    display: "flex",
                                    position: "relative",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                {" "}
                                <h1
                                    style={{
                                        fontSize: "clamp(50px, 10vw, 80px)",
                                    }}
                                    className=" absolute top-0"
                                >
                                    404
                                </h1>
                            </div>
                            <div
                                className="contant_box_404"
                                style={{ marginTop: "-50px" }}
                            >
                                <h3
                                    className="h2 text-3xl z-50 text-gray-800 mb-4"
                                    style={{
                                        fontSize: "clamp(30px, 10vw, 80px)",
                                    }}
                                >
                                    Look like you're lost
                                </h3>

                                <p className="text-gray-600 mt-6 mb-6 text-lg">
                                    the page you are looking for not available!
                                </p>

                                <Link
                                    href={route("dashboard")}
                                    className="link_404 rounded text-white  no-underline  transition-opacity"
                                    style={{
                                        padding: "10px 20px",
                                        background: "#39ac31",
                                        margin: "20px 0",
                                        display: "inline-block",
                                    }}
                                >
                                    Go to Home
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default NotFound;
