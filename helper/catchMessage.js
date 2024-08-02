export default function catchMessage(res,message, statusCode, err) {
    res.status(statusCode).send({
        success: false,
        message: message,
        error: err
    });
}
