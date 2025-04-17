import multer from "multer";
import { existsSync, mkdirSync } from "fs";
import { extname } from "path";
const allowedFileTypes = [
	".jpg",
	".jpeg",
	".png",
	".gif",
	".webp",
	".bmp",
	".mp4",
	".mov",
	".webm",
	".avi",
	".mkv",
	".pdf",
	".doc",
	".docx",
	".ppt",
	".pptx",
	".xls",
	".xlsx",
];
const upload = multer({
	storage: multer.diskStorage({
		destination: (req, file, cb) => {
			const uploadPath = req.body.upload_id
				? `./file-uploads/${req.body.upload_id}`
				: "./file-uploads";
			if (!existsSync(uploadPath)) {
				mkdirSync(uploadPath, { recursive: true });
			}
			cb(null, `${uploadPath}/`);
		},
		filename: (req, file, cb) => {
			const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
			const { upload_id, chunk_index, total_chunks } = req.body;
			let savedFileName: string;
			if (req.url.includes("chunk_uploads")) {
				const extnsn = extname(file.originalname) || ".chunk";
				savedFileName = `${upload_id}_${chunk_index}_${total_chunks}${extnsn}`;
			} else {
				savedFileName = `${file.fieldname}-${uniqueSuffix}${extname(
					file.originalname
				)}`;
			}
			cb(null, savedFileName);
		},
	}),
	limits: {
		fileSize: 1024 * 1024 * 200,
	},
	fileFilter: (req: Express.Request, file: Express.Multer.File, cb) => {
		let ext = extname(file.originalname);
		if (!allowedFileTypes.includes(ext)) {
			cb(
				new multer.MulterError(
					"LIMIT_UNEXPECTED_FILE",
					`File type ${ext} is not allowed.`
				)
			);
		} else {
			cb(null, true);
		}
	},
});

export default upload;
