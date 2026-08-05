import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import JobCard, { Job } from "../ui/JobCard"; // Adjust the import path as necessary
import { useRouter } from "next/navigation";

// Mock the Next.js router
jest.mock("next/navigation", () => ({
    useRouter: jest.fn(),
}));

describe("JobCard Component", () => {
    const mockPush = jest.fn();

    // Mock Job Data
    const mockJob: Job = {
        id: "job-123",
        title: "Frontend Developer Intern",
        location: "Bangkok, Thailand",
        department: "Engineering",
        currentApplicants: 2,
        maxApplicants: 5,
        tags: ["React", "Next.js", "TypeScript"],
        startDate: "2026-09-01",
        endDate: "2026-12-31",
        recruitStartDate: "01/08/2026",
        recruitEndDate: "31/08/2026",
    };

    beforeEach(() => {
        jest.clearAllMocks();
        (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    });

    describe("Rendering", () => {
        it("renders job details correctly", () => {
            render(<JobCard job={mockJob} />);

            expect(screen.getByText("Frontend sadasdasdDeveloper Intern")).toBeInTheDocument();
            expect(screen.getByText("Bangkok, Thailand")).toBeInTheDocument();
            expect(screen.getByText("Engineering")).toBeInTheDocument();
            expect(screen.getByText("2/5 คน")).toBeInTheDocument();
            expect(screen.getByText("React")).toBeInTheDocument();
            expect(
                screen.getByText("ระยะเวลาที่เปิดรับสมัคร: 01/08/2026 - 31/08/2026")
            ).toBeInTheDocument();
        });

        it("displays unlimited applicants correctly when maxApplicants is 0", () => {
            render(<JobCard job={{ ...mockJob, maxApplicants: 0 }} />);
            expect(screen.getByText("ไม่จำกัดจำนวน")).toBeInTheDocument();
        });

        it("handles more than 3 tags correctly", () => {
            const manyTagsJob = {
                ...mockJob,
                tags: ["React", "Next.js", "TypeScript", "Tailwind", "Jest"],
            };
            render(<JobCard job={manyTagsJob} />);

            expect(screen.getByText("React")).toBeInTheDocument();
            expect(screen.getByText("Next.js")).toBeInTheDocument();
            expect(screen.getByText("TypeScript")).toBeInTheDocument();
            expect(screen.queryByText("Tailwind")).not.toBeInTheDocument();
            expect(screen.getByText("+2...")).toBeInTheDocument();
        });

        it("displays 'ไม่กำหนดระยะเวลา' when recruit dates are missing or invalid", () => {
            const noDateJob = {
                ...mockJob,
                recruitStartDate: "-",
                recruitEndDate: "-",
            };
            render(<JobCard job={noDateJob} />);

            expect(
                screen.getByText("ระยะเวลาที่เปิดรับสมัคร: ไม่กำหนดระยะเวลา")
            ).toBeInTheDocument();
        });
    });

    describe("Interactions & Routing", () => {
        it("calls onClick when clicked in desktop mode (navigateOnMobile is false)", () => {
            const mockOnClick = jest.fn();
            render(<JobCard job={mockJob} onClick={mockOnClick} />);

            const card = screen.getByText("Frontend Developer Intern").closest("div.cursor-pointer");
            fireEvent.click(card!);

            expect(mockOnClick).toHaveBeenCalledTimes(1);
            expect(mockOnClick).toHaveBeenCalledWith(mockJob);
            expect(mockPush).not.toHaveBeenCalled();
        });

        it("routes to 'public' detail path when navigateOnMobile is true and mobileDetailPath is 'public'", () => {
            render(
                <JobCard
                    job={mockJob}
                    navigateOnMobile={true}
                    mobileDetailPath="public"
                />
            );

            const card = screen.getByText("Frontend Developer Intern").closest("div.cursor-pointer");
            fireEvent.click(card!);

            expect(mockPush).toHaveBeenCalledWith("/jobs/job-123");
        });

        it("routes to 'intern' detail path when navigateOnMobile is true and mobileDetailPath is 'intern'", () => {
            render(
                <JobCard
                    job={mockJob}
                    navigateOnMobile={true}
                    mobileDetailPath="intern"
                />
            );

            const card = screen.getByText("Frontend Developer Intern").closest("div.cursor-pointer");
            fireEvent.click(card!);

            expect(mockPush).toHaveBeenCalledWith("/intern-home/job-detail?jobId=job-123");
        });

        it("calls onBookmarkClick and stops propagation when bookmark is clicked", () => {
            const mockOnBookmarkClick = jest.fn();
            const mockOnClick = jest.fn();

            render(
                <JobCard
                    job={mockJob}
                    onBookmarkClick={mockOnBookmarkClick}
                    onClick={mockOnClick}
                />
            );

            // The button is the parent of the SVG, we can find it by its role or wrapping element
            const bookmarkBtn = screen.getByRole("button");
            fireEvent.click(bookmarkBtn);

            expect(mockOnBookmarkClick).toHaveBeenCalledTimes(1);
            expect(mockOnBookmarkClick).toHaveBeenCalledWith("job-123");
            // Ensure the card click event didn't fire due to e.stopPropagation()
            expect(mockOnClick).not.toHaveBeenCalled();
        });
    });

    describe("Styling states", () => {
        it("applies selected styling when isSelected is true and navigateOnMobile is false", () => {
            const { container } = render(<JobCard job={mockJob} isSelected={true} />);
            const cardDiv = container.firstChild;

            expect(cardDiv).toHaveClass("border-primary-700 shadow-md");
            expect(cardDiv).not.toHaveClass("border-gray-100");
        });

        it("does not apply selected styling when navigateOnMobile is true, even if isSelected is true", () => {
            const { container } = render(
                <JobCard job={mockJob} isSelected={true} navigateOnMobile={true} />
            );
            const cardDiv = container.firstChild;

            expect(cardDiv).toHaveClass("border-gray-100");
            expect(cardDiv).not.toHaveClass("border-primary-700 shadow-md");
        });

        it("applies favorite styling when isFavorite is true", () => {
            render(<JobCard job={mockJob} isFavorite={true} />);
            const bookmarkBtn = screen.getByRole("button");

            expect(bookmarkBtn).toHaveClass("text-primary-600");
            expect(bookmarkBtn).not.toHaveClass("text-gray-300");
        });
    });
});
