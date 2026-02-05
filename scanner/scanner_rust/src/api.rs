use actix_web::{HttpResponse, Responder, get, web};
use serde::Serialize;
use super::ic_reader::Reader;
use super::utills;

#[derive(Serialize)]
struct CardInfo {
    idm: String,
    reader: String
}

#[derive(Serialize)]
struct Status {
    status: String
}

#[get("/status")]
async fn get_status() -> impl Responder {
    let resp = Status{
        status: "ok".to_string()
    };
    HttpResponse::Ok().json(resp)
}

#[get("/cards")]
async fn get_cards() -> impl Responder {
    let reader = Reader::init();
    let card = reader.read_card();
    let idm_str = utills::hex_upper(&card.idm);
    let resp = CardInfo{
        idm: idm_str,
        reader: reader.name.clone(),
    };
    reader.close();
    HttpResponse::Ok().json(resp)
}


pub fn api_controller(cfg: &mut web::ServiceConfig) {
    cfg.service(web::scope("/api")
        .service(get_status)
        .service(get_cards));
}